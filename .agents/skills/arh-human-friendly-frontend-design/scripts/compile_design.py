#!/usr/bin/env python3
"""Validate a resolved design contract and emit portable preview artifacts.

Standard-library only. This validates a bounded subset of design safety; it does
not certify WCAG conformance or replace manual and representative-user review.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from pathlib import Path


REQUIRED_COLOR_TOKENS = (
    "canvas",
    "surface",
    "surface_raised",
    "text_primary",
    "text_secondary",
    "action_primary",
    "on_action_primary",
    "accent",
    "on_accent",
    "border",
    "focus",
    "error",
    "on_error",
)

REQUIRED_STATES = {
    "first_screen",
    "navigation",
    "information_list",
    "detail",
    "primary_action",
    "form",
    "success",
    "validation_error",
    "empty",
    "missing_media",
    "loading",
    "offline_or_failure",
    "help_or_contact",
    "narrow_mobile",
    "desktop",
    "enlarged_text_reflow",
    "keyboard_focus",
    "reduced_motion",
    "long_or_translated_content",
}

PRESENTATION_FAMILIES = {
    "calm_domestic",
    "quiet_editorial",
    "clear_everyday",
    "local_crafted",
    "gentle_wellbeing",
    "lively_community",
}

RENDERED_STATE_MARKERS = {
    "form",
    "success",
    "validation_error",
    "empty",
    "missing_media",
    "loading",
    "offline_or_failure",
    "help_or_contact",
}

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
FONT_STACK_RE = re.compile(r"^[A-Za-z0-9 ,.\'\"-]+$")
TOKEN_NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")


class ContractError(ValueError):
    pass


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContractError(f"cannot read JSON contract: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError("contract root must be an object")
    return value


def require_object(parent: dict, key: str) -> dict:
    value = parent.get(key)
    if not isinstance(value, dict):
        raise ContractError(f"{key} must be an object")
    return value


def channel_to_linear(channel: int) -> float:
    value = channel / 255
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def luminance(value: str) -> float:
    if not HEX_RE.fullmatch(value):
        raise ContractError(f"invalid six-digit hex color: {value!r}")
    red, green, blue = (int(value[index : index + 2], 16) for index in (1, 3, 5))
    return 0.2126 * channel_to_linear(red) + 0.7152 * channel_to_linear(green) + 0.0722 * channel_to_linear(blue)


def contrast(first: str, second: str) -> float:
    high, low = sorted((luminance(first), luminance(second)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def validate(contract: dict) -> tuple[list[dict], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    checks: list[dict] = []

    if contract.get("schema_version") != 1:
        errors.append("schema_version must equal 1")
    for key in ("id", "presentation_family", "audience", "direction", "tokens", "safety", "required_states"):
        if key not in contract:
            errors.append(f"missing required field: {key}")

    for key in ("id", "presentation_family"):
        if not isinstance(contract.get(key), str) or not contract.get(key):
            errors.append(f"{key} must be a non-empty string")
    if contract.get("presentation_family") not in PRESENTATION_FAMILIES:
        errors.append("presentation_family must be a registered family")
    if not isinstance(contract.get("audience"), dict):
        errors.append("audience must be an object")
    adapters = contract.get("domain_adapters", [])
    if not isinstance(adapters, list) or not all(isinstance(item, str) and item for item in adapters):
        errors.append("domain_adapters must be an array of non-empty strings")
    elif len(adapters) != len(set(adapters)):
        errors.append("domain_adapters must not contain duplicates")

    direction = contract.get("direction", {})
    if not isinstance(direction, dict):
        errors.append("direction must be an object")
    else:
        for key in ("layout_rhythm", "imagery_policy", "motion_policy", "forbidden_traits"):
            if key not in direction:
                errors.append(f"direction.{key} is required")
        for key in ("layout_rhythm", "imagery_policy", "motion_policy"):
            if key in direction and (not isinstance(direction[key], str) or not direction[key]):
                errors.append(f"direction.{key} must be a non-empty string")
        if "forbidden_traits" in direction and not isinstance(direction["forbidden_traits"], list):
            errors.append("direction.forbidden_traits must be an array")
        elif isinstance(direction.get("forbidden_traits"), list):
            if not all(isinstance(item, str) and item for item in direction["forbidden_traits"]):
                errors.append("direction.forbidden_traits must contain non-empty strings")
            elif len(direction["forbidden_traits"]) != len(set(direction["forbidden_traits"])):
                errors.append("direction.forbidden_traits must not contain duplicates")

    tokens = contract.get("tokens", {})
    colors = tokens.get("color", {}) if isinstance(tokens, dict) else {}
    if not isinstance(colors, dict):
        errors.append("tokens.color must be an object")
        colors = {}
    for name in REQUIRED_COLOR_TOKENS:
        value = colors.get(name)
        if not isinstance(value, str) or not HEX_RE.fullmatch(value):
            errors.append(f"tokens.color.{name} must be a six-digit hex color")
    for name, value in colors.items():
        if not isinstance(name, str) or not TOKEN_NAME_RE.fullmatch(name):
            errors.append(f"tokens.color key {name!r} must match {TOKEN_NAME_RE.pattern}")
        if not isinstance(value, str) or not HEX_RE.fullmatch(value):
            errors.append(f"tokens.color.{name} must be a six-digit hex color")

    typography = tokens.get("typography", {}) if isinstance(tokens, dict) else {}
    if not isinstance(typography, dict):
        errors.append("tokens.typography must be an object")
        typography = {}
    for stack_name in ("body_stack", "display_stack"):
        stack = typography.get(stack_name)
        if not isinstance(stack, str) or not stack or not FONT_STACK_RE.fullmatch(stack):
            errors.append(f"tokens.typography.{stack_name} must be a safe CSS font stack")
    base_px = typography.get("base_px")
    if isinstance(base_px, bool) or not isinstance(base_px, (int, float)) or not 16 <= base_px <= 32:
        errors.append("tokens.typography.base_px must be between 16 and 32")
    elif base_px < 18:
        warnings.append("body type is below the preferred 18px mixed-confidence starter default")
    line_height = typography.get("line_height")
    if isinstance(line_height, bool) or not isinstance(line_height, (int, float)) or not 1.2 <= line_height <= 2.0:
        errors.append("tokens.typography.line_height must be between 1.2 and 2.0")

    shape = tokens.get("shape", {}) if isinstance(tokens, dict) else {}
    if not isinstance(shape, dict):
        errors.append("tokens.shape must be an object")
        shape = {}
    for name in ("control_radius_px", "card_radius_px"):
        value = shape.get(name)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 64:
            errors.append(f"tokens.shape.{name} must be a number between 0 and 64")

    spacing = tokens.get("spacing", {}) if isinstance(tokens, dict) else {}
    if not isinstance(spacing, dict):
        errors.append("tokens.spacing must be an object")
        spacing = {}
    section_gap = spacing.get("section_gap_px")
    if isinstance(section_gap, bool) or not isinstance(section_gap, (int, float)) or not 16 <= section_gap <= 192:
        errors.append("tokens.spacing.section_gap_px must be between 16 and 192")

    safety = contract.get("safety", {})
    if not isinstance(safety, dict):
        errors.append("safety must be an object")
        safety = {}
    expected = {
        "wcag_target": "AA",
        "reduced_motion": True,
        "color_only_meaning": False,
        "focus_visible": True,
    }
    for key, value in expected.items():
        if safety.get(key) != value:
            errors.append(f"safety.{key} must equal {value!r}")
    target = safety.get("minimum_target_css_px")
    if not isinstance(target, (int, float)) or target < 24:
        errors.append("safety.minimum_target_css_px must be at least 24")
    elif target < 44:
        warnings.append("target size meets the AA floor but is below the preferred 44px starter default")

    states = contract.get("required_states")
    if not isinstance(states, list) or not all(isinstance(item, str) for item in states):
        errors.append("required_states must be an array of strings")
        states = []
    elif len(states) != len(set(states)):
        errors.append("required_states must not contain duplicates")
    missing_states = sorted(REQUIRED_STATES - set(states))
    if missing_states:
        errors.append("missing required states: " + ", ".join(missing_states))

    if not errors:
        pairs = (
            ("text_primary_on_canvas", "text_primary", "canvas", 4.5),
            ("text_secondary_on_canvas", "text_secondary", "canvas", 4.5),
            ("text_primary_on_surface", "text_primary", "surface", 4.5),
            ("action_text", "on_action_primary", "action_primary", 4.5),
            ("accent_text", "on_accent", "accent", 4.5),
            ("error_text", "on_error", "error", 4.5),
            ("focus_on_canvas", "focus", "canvas", 3.0),
            ("focus_on_surface", "focus", "surface", 3.0),
        )
        for check_id, foreground, background, minimum in pairs:
            ratio = contrast(colors[foreground], colors[background])
            passed = ratio + 1e-9 >= minimum
            checks.append({
                "id": check_id,
                "foreground": foreground,
                "background": background,
                "ratio": round(ratio, 2),
                "minimum": minimum,
                "passed": passed,
            })
            if not passed:
                errors.append(f"contrast {check_id} is {ratio:.2f}:1; requires {minimum:.1f}:1")

    if errors:
        raise ContractError("; ".join(errors))
    return checks, warnings


def dtcg_color(value: str, description: str) -> dict:
    channels = [round(int(value[index : index + 2], 16) / 255, 6) for index in (1, 3, 5)]
    return {
        "$value": {"colorSpace": "srgb", "components": channels, "alpha": 1, "hex": value.upper()},
        "$description": description,
    }


def build_dtcg(contract: dict) -> dict:
    tokens = contract["tokens"]
    color = {"$type": "color"}
    for name in REQUIRED_COLOR_TOKENS:
        color[name] = dtcg_color(tokens["color"][name], f"Semantic {name.replace('_', ' ')} color")
    return {
        "$description": f"Resolved tokens for {contract['id']}",
        "color": color,
        "dimension": {
            "$type": "dimension",
            "body_size": {"$value": {"value": tokens["typography"]["base_px"], "unit": "px"}},
            "control_radius": {"$value": {"value": tokens["shape"]["control_radius_px"], "unit": "px"}},
            "card_radius": {"$value": {"value": tokens["shape"]["card_radius_px"], "unit": "px"}},
            "section_gap": {"$value": {"value": tokens["spacing"]["section_gap_px"], "unit": "px"}},
        },
    }


def build_css(contract: dict) -> str:
    tokens = contract["tokens"]
    lines = [":root {"]
    for name, value in sorted(tokens["color"].items()):
        lines.append(f"  --color-{name.replace('_', '-')}: {value};")
    typography = tokens["typography"]
    shape = tokens["shape"]
    spacing = tokens["spacing"]
    lines.extend((
        f"  --font-display: {typography['display_stack']};",
        f"  --font-body: {typography['body_stack']};",
        f"  --font-size-body: {typography['base_px']}px;",
        f"  --line-height-body: {typography['line_height']};",
        f"  --radius-control: {shape['control_radius_px']}px;",
        f"  --radius-card: {shape['card_radius_px']}px;",
        f"  --space-section: {spacing['section_gap_px']}px;",
        "}",
        "",
    ))
    return "\n".join(lines)


def render_preview(contract: dict, template: str) -> str:
    token = contract["tokens"]
    color = token["color"]
    replacements = {
        "{{TITLE}}": html.escape(contract.get("label", contract["id"])),
        "{{FAMILY}}": html.escape(contract["presentation_family"].replace("_", " ").title()),
        "{{FEELING}}": html.escape(contract.get("desired_feeling", "Clear, welcoming, and easy to continue")),
        "{{FONT_DISPLAY}}": token["typography"]["display_stack"],
        "{{FONT_BODY}}": token["typography"]["body_stack"],
        "{{BASE_PX}}": str(token["typography"]["base_px"]),
        "{{LINE_HEIGHT}}": str(token["typography"]["line_height"]),
        "{{CARD_RADIUS}}": str(token["shape"]["card_radius_px"]),
        "{{CONTROL_RADIUS}}": str(token["shape"]["control_radius_px"]),
    }
    for name, value in color.items():
        replacements["{{COLOR_" + name.upper() + "}}"] = value
    output = template
    for needle, value in replacements.items():
        output = output.replace(needle, value)
    unresolved = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", output)))
    if unresolved:
        raise ContractError("preview template has unresolved placeholders: " + ", ".join(unresolved))
    missing_markers = sorted(state for state in RENDERED_STATE_MARKERS if f'data-state="{state}"' not in output)
    if missing_markers:
        raise ContractError("preview template is missing state markers: " + ", ".join(missing_markers))
    return output


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("contract", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    try:
        contract = load_json(args.contract.resolve())
        checks, warnings = validate(contract)
        canonical = json.dumps(contract, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        digest = hashlib.sha256(canonical).hexdigest()
        output = args.out.resolve()
        output.mkdir(parents=True, exist_ok=True)
        template_path = Path(__file__).resolve().parent.parent / "assets" / "preview-template.html"
        template = template_path.read_text(encoding="utf-8")
        write_json(output / "resolved-design.json", contract)
        write_json(output / "design.tokens.json", build_dtcg(contract))
        (output / "tokens.css").write_text(build_css(contract), encoding="utf-8")
        preview = render_preview(contract, template)
        (output / "preview.html").write_text(preview, encoding="utf-8")
        specimen_manifest = {
            "schema_version": 1,
            "contract_id": contract["id"],
            "declared_states": sorted(contract["required_states"]),
            "rendered_state_markers": sorted(RENDERED_STATE_MARKERS),
            "manual_viewport_checks_required": ["narrow_mobile", "desktop", "enlarged_text_reflow", "keyboard_focus", "reduced_motion", "long_or_translated_content"],
        }
        write_json(output / "specimen-manifest.json", specimen_manifest)
        receipt = {
            "schema_version": 1,
            "contract_id": contract["id"],
            "contract_sha256": digest,
            "passed": True,
            "scope": [
                "runtime contract validation aligned to the bundled v1 schema fields",
                "required universal state declarations",
                "rendered generic specimen state markers",
                "selected semantic color-pair contrast",
                "fixed safety locks",
                "artifact generation",
            ],
            "does_not_prove": [
                "complete WCAG conformance",
                "content clarity",
                "keyboard or assistive-technology behavior",
                "responsive implementation quality",
                "representative-user acceptance",
            ],
            "contrast_checks": checks,
            "warnings": warnings,
            "artifacts": ["resolved-design.json", "design.tokens.json", "tokens.css", "preview.html", "specimen-manifest.json", "validation-receipt.json"],
        }
        write_json(output / "validation-receipt.json", receipt)
    except (ContractError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({"passed": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2

    print(json.dumps({"passed": True, "contract": contract["id"], "output": str(output), "warnings": warnings}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
