import { describe, it, expect } from 'vitest';
import {
  ControlType,
  CONTROL_MAP,
  CONTROL_MAP_PAPI,
  OPTION_INPUT_CONTROL,
} from '../FormType';

describe('FormType', () => {
  describe('ControlType enum', () => {
    it('should define all control types', () => {
      expect(ControlType.Section).toBe(1);
      expect(ControlType.NestedInput).toBe(2);
      expect(ControlType.InnerHTML).toBe(3);
      expect(ControlType.VariableInput).toBe(4);
      expect(ControlType.DateInput).toBe(11);
      expect(ControlType.DateTimeLocalInput).toBe(12);
      expect(ControlType.TimeInput).toBe(13);
      expect(ControlType.MonthInput).toBe(14);
      expect(ControlType.WeekInput).toBe(15);
      expect(ControlType.SingleCheckInput).toBe(16);
      expect(ControlType.ToggleInput).toBe(17);
      expect(ControlType.RangeSliderInput).toBe(18);
      expect(ControlType.UrlInput).toBe(19);
      expect(ControlType.CurrencyInput).toBe(20);
      expect(ControlType.ListTextInputRepeat).toBe(21);
      expect(ControlType.ListSelectInputRepeat).toBe(22);
      expect(ControlType.MultipleSelectInput).toBe(23);
      expect(ControlType.MaskingInput).toBe(24);
      expect(ControlType.TextInput).toBe(25);
      expect(ControlType.RadioInput).toBe(26);
      expect(ControlType.SelectInput).toBe(27);
      expect(ControlType.NumberInput).toBe(28);
      expect(ControlType.CheckboxInput).toBe(29);
      expect(ControlType.TextAreaInput).toBe(30);
      expect(ControlType.EmailInput).toBe(31);
      expect(ControlType.PhotoInput).toBe(32);
      expect(ControlType.GpsInput).toBe(33);
      expect(ControlType.CsvInput).toBe(34);
      expect(ControlType.NowInput).toBe(35);
      expect(ControlType.SignatureInput).toBe(36);
      expect(ControlType.UnitInput).toBe(37);
      expect(ControlType.DecimalInput).toBe(38);
    });

    it('should have unique values for all control types', () => {
      const values = Object.values(ControlType).filter(
        (v) => typeof v === 'number'
      );
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('CONTROL_MAP', () => {
    it('should be a Map', () => {
      expect(CONTROL_MAP).toBeInstanceOf(Map);
    });

    it('should have entries for all input control types', () => {
      const expectedControls = [
        ControlType.NestedInput,
        ControlType.TextInput,
        ControlType.RadioInput,
        ControlType.SelectInput,
        ControlType.NumberInput,
        ControlType.CheckboxInput,
        ControlType.TextAreaInput,
        ControlType.EmailInput,
        ControlType.UrlInput,
        ControlType.DateInput,
        ControlType.DateTimeLocalInput,
        ControlType.TimeInput,
        ControlType.MonthInput,
        ControlType.WeekInput,
        ControlType.SingleCheckInput,
        ControlType.ToggleInput,
        ControlType.RangeSliderInput,
        ControlType.InnerHTML,
        ControlType.CurrencyInput,
        ControlType.ListTextInputRepeat,
        ControlType.ListSelectInputRepeat,
        ControlType.MultipleSelectInput,
        ControlType.MaskingInput,
        ControlType.VariableInput,
        ControlType.PhotoInput,
        ControlType.GpsInput,
        ControlType.CsvInput,
        ControlType.NowInput,
        ControlType.SignatureInput,
        ControlType.UnitInput,
        ControlType.DecimalInput,
      ];

      expectedControls.forEach((controlType) => {
        expect(CONTROL_MAP.has(controlType)).toBe(true);
      });
    });

    it('should return component functions for each control type', () => {
      CONTROL_MAP.forEach((component, controlType) => {
        expect(typeof component).toBe('function');
      });
    });

    it('should not have Section in CONTROL_MAP', () => {
      expect(CONTROL_MAP.has(ControlType.Section)).toBe(false);
    });
  });

  describe('CONTROL_MAP_PAPI', () => {
    it('should be a Map', () => {
      expect(CONTROL_MAP_PAPI).toBeInstanceOf(Map);
    });

    it('should have the same number of entries as CONTROL_MAP', () => {
      expect(CONTROL_MAP_PAPI.size).toBe(CONTROL_MAP.size);
    });

    it('should have PAPI-specific components for certain types', () => {
      // These should be PAPI versions
      expect(CONTROL_MAP_PAPI.has(ControlType.TextInput)).toBe(true);
      expect(CONTROL_MAP_PAPI.has(ControlType.NumberInput)).toBe(true);
      expect(CONTROL_MAP_PAPI.has(ControlType.RadioInput)).toBe(true);
      expect(CONTROL_MAP_PAPI.has(ControlType.SelectInput)).toBe(true);
    });

    it('should return component functions for each control type', () => {
      CONTROL_MAP_PAPI.forEach((component) => {
        expect(typeof component).toBe('function');
      });
    });
  });

  describe('OPTION_INPUT_CONTROL', () => {
    it('should contain SelectInput and RadioInput', () => {
      expect(OPTION_INPUT_CONTROL).toContain(ControlType.SelectInput);
      expect(OPTION_INPUT_CONTROL).toContain(ControlType.RadioInput);
    });

    it('should have exactly 2 entries', () => {
      expect(OPTION_INPUT_CONTROL.length).toBe(2);
    });
  });

  describe('control type consistency', () => {
    it('CONTROL_MAP and CONTROL_MAP_PAPI should have same keys', () => {
      const mapKeys = Array.from(CONTROL_MAP.keys());
      const papiKeys = Array.from(CONTROL_MAP_PAPI.keys());

      expect(mapKeys.sort()).toEqual(papiKeys.sort());
    });
  });
});
