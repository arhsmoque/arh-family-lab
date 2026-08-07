import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("compile_design.py")
SPEC = importlib.util.spec_from_file_location("compile_design", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class CompileDesignTests(unittest.TestCase):
    def setUp(self):
        self.source_root = Path(__file__).resolve().parent.parent
        self.starters = sorted((self.source_root / "assets" / "starter-packs").glob("*.json"))

    def test_all_starters_validate(self):
        self.assertGreaterEqual(len(self.starters), 4)
        for path in self.starters:
            with self.subTest(path=path.name):
                contract = json.loads(path.read_text(encoding="utf-8"))
                checks, warnings = MODULE.validate(contract)
                self.assertTrue(checks)
                self.assertFalse([check for check in checks if not check["passed"]])
                self.assertIsInstance(warnings, list)

    def test_eval_matrix_covers_every_family_adapter_and_nontrigger(self):
        matrix = json.loads((self.source_root / "assets" / "eval-cases.json").read_text(encoding="utf-8"))
        cases = matrix["cases"]
        families = {family for case in cases for family in case["candidate_families"]}
        adapters = {adapter for case in cases for adapter in case["expected_adapters"]}
        expected_adapters = {
            "family_and_multigenerational", "education_and_learning", "food_and_local_commerce",
            "community_and_public_facing_services", "wellbeing_and_support",
            "household_and_family_utilities", "local_professional_and_lifestyle_services",
            "mixed_or_new_domain",
        }
        self.assertEqual(MODULE.PRESENTATION_FAMILIES, families)
        self.assertEqual(expected_adapters, adapters)
        self.assertTrue(any(not case["should_trigger"] for case in cases))

    def test_faint_secondary_text_fails(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        contract["tokens"]["color"]["text_secondary"] = "#B8B2AA"
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_missing_state_fails(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        contract["required_states"].remove("offline_or_failure")
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_invalid_schema_fields_and_duplicate_states_fail(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        contract["presentation_family"] = "unregistered"
        contract["audience"] = "everyone"
        contract["required_states"].append(contract["required_states"][0])
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_css_interpolation_values_are_bounded(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        contract["tokens"]["shape"]["card_radius_px"] = "0;--audit-marker:1"
        contract["tokens"]["color"]["unsafe_extra"] = "#fff;--audit-marker:1"
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_css_token_name_injection_is_rejected(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        contract["tokens"]["color"]["x: #fff; } body { --audit-marker"] = "#FFFFFF"
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_missing_shape_fails_in_validation(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        del contract["tokens"]["shape"]
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)

    def test_preview_has_no_placeholders(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        template = (self.source_root / "assets" / "preview-template.html").read_text(encoding="utf-8")
        rendered = MODULE.render_preview(contract, template)
        self.assertNotIn("{{", rendered)
        self.assertIn(contract["label"], rendered)
        for state in MODULE.RENDERED_STATE_MARKERS:
            self.assertIn(f'data-state="{state}"', rendered)

    def test_font_stack_is_preserved_and_unsafe_css_is_rejected(self):
        contract = json.loads(self.starters[0].read_text(encoding="utf-8"))
        template = (self.source_root / "assets" / "preview-template.html").read_text(encoding="utf-8")
        rendered = MODULE.render_preview(contract, template)
        self.assertIn("system-ui, 'Segoe UI', sans-serif", rendered)
        contract["tokens"]["typography"]["body_stack"] = "system-ui; color: red"
        with self.assertRaises(MODULE.ContractError):
            MODULE.validate(contract)


if __name__ == "__main__":
    unittest.main()
