import { describe, it, expect, beforeEach } from 'vitest';
import { createFormStores, FormStores } from '../createStores';

describe('createFormStores', () => {
  let stores: FormStores;

  beforeEach(() => {
    stores = createFormStores();
  });

  describe('factory creation', () => {
    it('should create a FormStores object', () => {
      expect(stores).toBeDefined();
      expect(typeof stores).toBe('object');
    });

    it('should include all main stores', () => {
      expect(stores.reference).toBeDefined();
      expect(stores.response).toBeDefined();
      expect(stores.template).toBeDefined();
      expect(stores.validation).toBeDefined();
      expect(stores.preset).toBeDefined();
      expect(stores.media).toBeDefined();
      expect(stores.remark).toBeDefined();
      expect(stores.sidebar).toBeDefined();
      expect(stores.locale).toBeDefined();
    });

    it('should include all helper stores', () => {
      expect(stores.summary).toBeDefined();
      expect(stores.counter).toBeDefined();
      expect(stores.input).toBeDefined();
      expect(stores.nested).toBeDefined();
      expect(stores.note).toBeDefined();
      expect(stores.principal).toBeDefined();
    });

    it('should include all signals', () => {
      expect(stores.referenceMap).toBeDefined();
      expect(stores.sidebarIndexMap).toBeDefined();
      expect(stores.compEnableMap).toBeDefined();
      expect(stores.compValidMap).toBeDefined();
      expect(stores.compSourceOptionMap).toBeDefined();
      expect(stores.compVarMap).toBeDefined();
      expect(stores.compSourceQuestionMap).toBeDefined();
      expect(stores.referenceHistoryEnable).toBeDefined();
      expect(stores.referenceHistory).toBeDefined();
      expect(stores.sidebarHistory).toBeDefined();
      expect(stores.referenceEnableFalse).toBeDefined();
    });

    it('should include dispose function', () => {
      expect(typeof stores.dispose).toBe('function');
    });
  });

  describe('store structure', () => {
    it('should return stores as tuples [getter, setter]', () => {
      expect(Array.isArray(stores.reference)).toBe(true);
      expect(stores.reference).toHaveLength(2);
      expect(typeof stores.reference[0]).toBe('object');
      expect(typeof stores.reference[1]).toBe('function');
    });

    it('should return signals as tuples [accessor, setter]', () => {
      expect(Array.isArray(stores.referenceMap)).toBe(true);
      expect(stores.referenceMap).toHaveLength(2);
      expect(typeof stores.referenceMap[0]).toBe('function');
      expect(typeof stores.referenceMap[1]).toBe('function');
    });
  });

  describe('initial values', () => {
    describe('reference store', () => {
      it('should have default initial values', () => {
        const [reference] = stores.reference;
        expect(reference.details).toEqual([]);
        expect(reference.sidebar).toEqual([]);
      });
    });

    describe('response store', () => {
      it('should have default initial values', () => {
        const [response] = stores.response;
        expect(response.status).toBe(1);
        expect(response.details.dataKey).toBe('');
        expect(response.details.answers).toEqual([]);
        expect(response.details.summary).toEqual([]);
        expect(response.details.counter).toEqual([]);
      });
    });

    describe('template store', () => {
      it('should have default initial values', () => {
        const [template] = stores.template;
        expect(template.status).toBe(1);
        expect(template.details.description).toBe('');
        expect(template.details.dataKey).toBe('');
        expect(template.details.acronym).toBe('');
        expect(template.details.title).toBe('');
        expect(template.details.version).toBe('');
        expect(template.details.components).toEqual([]);
      });
    });

    describe('validation store', () => {
      it('should have default initial values', () => {
        const [validation] = stores.validation;
        expect(validation.status).toBe(1);
        expect(validation.details.description).toBe('');
        expect(validation.details.dataKey).toBe('');
        expect(validation.details.version).toBe('');
        expect(validation.details.testFunctions).toEqual([]);
      });
    });

    describe('preset store', () => {
      it('should have default initial values', () => {
        const [preset] = stores.preset;
        expect(preset.status).toBe(1);
        expect(preset.details.description).toBe('');
        expect(preset.details.dataKey).toBe('');
        expect(preset.details.predata).toEqual([]);
      });
    });

    describe('media store', () => {
      it('should have default initial values', () => {
        const [media] = stores.media;
        expect(media.status).toBe(1);
        expect(media.details.dataKey).toBe('');
        expect(media.details.media).toEqual([]);
      });
    });

    describe('remark store', () => {
      it('should have default initial values', () => {
        const [remark] = stores.remark;
        expect(remark.status).toBe(1);
        expect(remark.details.dataKey).toBe('');
        expect(remark.details.notes).toEqual([]);
      });
    });

    describe('sidebar store', () => {
      it('should have default initial values', () => {
        const [sidebar] = stores.sidebar;
        expect(sidebar.details).toEqual([]);
      });
    });

    describe('locale store', () => {
      it('should have default locale values', () => {
        const [locale] = stores.locale;
        expect(locale.status).toBe(1);
        expect(locale.details.language).toBeDefined();
        expect(locale.details.language).toHaveLength(1);
        expect(locale.details.language[0].validationRequired).toBe('Required');
      });
    });

    describe('summary store', () => {
      it('should have default initial values', () => {
        const [summary] = stores.summary;
        expect(summary.answer).toBe(0);
        expect(summary.blank).toBe(0);
        expect(summary.error).toBe(0);
        expect(summary.remark).toBe(0);
        expect(summary.clean).toBe(0);
      });
    });

    describe('counter store', () => {
      it('should have default initial values', () => {
        const [counter] = stores.counter;
        expect(counter.render).toBe(0);
        expect(counter.validate).toBe(0);
      });
    });

    describe('input store', () => {
      it('should have default initial values', () => {
        const [input] = stores.input;
        expect(input.currentDataKey).toBe('');
      });
    });

    describe('nested store', () => {
      it('should have default initial values', () => {
        const [nested] = stores.nested;
        expect(nested.details).toEqual([]);
      });
    });

    describe('note store', () => {
      it('should have default initial values', () => {
        const [note] = stores.note;
        expect(note.status).toBe(1);
        expect(note.details.dataKey).toBe('');
        expect(note.details.notes).toEqual([]);
      });
    });

    describe('principal store', () => {
      it('should have default initial values', () => {
        const [principal] = stores.principal;
        expect(principal.status).toBe(1);
        expect(principal.details.principals).toEqual([]);
      });
    });

    describe('signals', () => {
      it('should have empty default maps', () => {
        expect(stores.referenceMap[0]()).toEqual({});
        expect(stores.sidebarIndexMap[0]()).toEqual({});
        expect(stores.compEnableMap[0]()).toEqual({});
        expect(stores.compValidMap[0]()).toEqual({});
        expect(stores.compSourceOptionMap[0]()).toEqual({});
        expect(stores.compVarMap[0]()).toEqual({});
        expect(stores.compSourceQuestionMap[0]()).toEqual({});
      });

      it('should have default history values', () => {
        expect(stores.referenceHistoryEnable[0]()).toBe(false);
        expect(stores.referenceHistory[0]()).toEqual([]);
        expect(stores.sidebarHistory[0]()).toEqual([]);
        expect(stores.referenceEnableFalse[0]()).toEqual([]);
      });
    });
  });

  describe('initial data', () => {
    it('should accept initial response data', () => {
      const customStores = createFormStores({
        response: {
          dataKey: 'FORM_001',
          answers: [{ dataKey: 'Q1', value: 'test' }],
        },
      });

      const [response] = customStores.response;
      expect(response.details.dataKey).toBe('FORM_001');
      expect(response.details.answers).toEqual([{ dataKey: 'Q1', value: 'test' }]);
    });

    it('should accept initial template data', () => {
      const customStores = createFormStores({
        template: {
          title: 'Test Form',
          version: '1.0.0',
          components: [{ dataKey: 'Q1', type: 'text' }],
        },
      });

      const [template] = customStores.template;
      expect(template.details.title).toBe('Test Form');
      expect(template.details.version).toBe('1.0.0');
      expect(template.details.components).toEqual([{ dataKey: 'Q1', type: 'text' }]);
    });

    it('should accept custom locale data', () => {
      const customLocale = {
        status: 1,
        details: {
          language: [
            {
              componentAdded: 'Komponen berhasil ditambahkan!',
              componentDeleted: 'Komponen berhasil dihapus!',
              componentEdited: 'Komponen berhasil diubah!',
              componentEmpty: 'Komponen tidak boleh kosong',
              componentNotAllowed: 'Hanya 1 komponen yang diperbolehkan untuk diubah',
              componentRendered: 'Komponen terkait sedang dirender, mohon tunggu.',
              componentSelected: 'Komponen ini sudah dipilih',
              fetchFailed: 'Gagal mengambil data.',
              fileInvalidFormat: 'Format file tidak sesuai!',
              fileInvalidMaxSize: 'Ukuran maksimal yang diperbolehkan adalah ',
              fileInvalidMinSize: 'Ukuran minimal yang diperbolehkan adalah ',
              fileUploaded: 'File berhasil diunggah!',
              locationAcquired: 'Lokasi berhasil didapatkan!',
              remarkAdded: 'Catatan berhasil ditambahkan!',
              remarkEmpty: 'Catatan tidak boleh kosong!',
              submitEmpty: 'Pastikan semua isian terisi',
              submitInvalid: 'Pastikan semua isian valid',
              submitWarning: 'Masih ada peringatan pada isian',
              summaryAnswer: 'Jawaban',
              summaryBlank: 'Kosong',
              summaryError: 'Error',
              summaryRemark: 'Catatan',
              uploadCsv: 'Unggah file CSV',
              uploadImage: 'Unggah file gambar',
              validationDate: 'Format tanggal tidak valid',
              validationInclude: 'Nilai yang diperbolehkan adalah $values',
              validationMax: 'Nilai maksimal adalah',
              validationMaxLength: 'Karakter maksimal adalah',
              validationMin: 'Nilai minimal adalah',
              validationMinLength: 'Karakter minimal adalah',
              validationRequired: 'Wajib diisi',
              validationStep: 'Nilai harus kelipatan dari',
              verificationInvalid: 'Verifikasi tidak valid',
              verificationSubmitted: 'Data sedang dikirim. Terima kasih!',
              validationUrl: 'Alamat URL tidak valid, gunakan https://',
              validationEmail: 'Alamat email tidak valid',
              validationApi: 'Input tidak valid dari respon API',
              errorSaving: 'Terjadi kesalahan saat menyimpan komponen ',
              errorExpression: 'Terjadi kesalahan saat mengevaluasi ekspresi pada komponen ',
              errorEnableExpression:
                'Terjadi kesalahan saat mengevaluasi enable pada komponen ',
              errorValidationExpression:
                'Terjadi kesalahan saat mengevaluasi validasi pada komponen ',
            },
          ],
        },
      };

      const customStores = createFormStores({ locale: customLocale });
      const [locale] = customStores.locale;
      expect(locale.details.language[0].validationRequired).toBe('Wajib diisi');
    });
  });

  describe('store updates', () => {
    it('should update reference store', () => {
      const [reference, setReference] = stores.reference;

      setReference('details', [{ dataKey: 'Q1', type: 'text' }]);

      expect(reference.details).toEqual([{ dataKey: 'Q1', type: 'text' }]);
    });

    it('should update response store', () => {
      const [response, setResponse] = stores.response;

      setResponse('details', 'dataKey', 'FORM_001');
      setResponse('details', 'answers', [{ dataKey: 'Q1', value: 'test' }]);

      expect(response.details.dataKey).toBe('FORM_001');
      expect(response.details.answers).toEqual([{ dataKey: 'Q1', value: 'test' }]);
    });

    it('should update summary store', () => {
      const [summary, setSummary] = stores.summary;

      setSummary('answer', 5);
      setSummary('blank', 3);
      setSummary('error', 1);

      expect(summary.answer).toBe(5);
      expect(summary.blank).toBe(3);
      expect(summary.error).toBe(1);
    });

    it('should update counter store', () => {
      const [counter, setCounter] = stores.counter;

      setCounter('render', 10);
      setCounter('validate', 5);

      expect(counter.render).toBe(10);
      expect(counter.validate).toBe(5);
    });

    it('should update input store', () => {
      const [input, setInput] = stores.input;

      setInput('currentDataKey', 'Q1');

      expect(input.currentDataKey).toBe('Q1');
    });
  });

  describe('signal updates', () => {
    it('should update referenceMap signal', () => {
      const [getReferenceMap, setReferenceMap] = stores.referenceMap;

      setReferenceMap({ Q1: 0, Q2: 1 });

      expect(getReferenceMap()).toEqual({ Q1: 0, Q2: 1 });
    });

    it('should update compEnableMap signal', () => {
      const [getCompEnableMap, setCompEnableMap] = stores.compEnableMap;

      setCompEnableMap({ Q1: ['Q2', 'Q3'] });

      expect(getCompEnableMap()).toEqual({ Q1: ['Q2', 'Q3'] });
    });

    it('should update referenceHistoryEnable signal', () => {
      const [getHistoryEnable, setHistoryEnable] = stores.referenceHistoryEnable;

      expect(getHistoryEnable()).toBe(false);

      setHistoryEnable(true);

      expect(getHistoryEnable()).toBe(true);
    });

    it('should update referenceHistory signal', () => {
      const [getHistory, setHistory] = stores.referenceHistory;

      setHistory([{ action: 'add', dataKey: 'Q1' }]);

      expect(getHistory()).toEqual([{ action: 'add', dataKey: 'Q1' }]);
    });

    it('should update referenceEnableFalse signal', () => {
      const [getEnableFalse, setEnableFalse] = stores.referenceEnableFalse;

      setEnableFalse([{ parentIndex: [0, 1] }]);

      expect(getEnableFalse()).toEqual([{ parentIndex: [0, 1] }]);
    });
  });

  describe('dispose', () => {
    it('should reset all stores to initial state', () => {
      // Modify some stores first
      const [, setResponse] = stores.response;
      const [, setSummary] = stores.summary;
      const [, setReferenceMap] = stores.referenceMap;
      const [, setHistoryEnable] = stores.referenceHistoryEnable;

      setResponse('details', 'dataKey', 'FORM_001');
      setSummary('answer', 10);
      setReferenceMap({ Q1: 0 });
      setHistoryEnable(true);

      // Dispose
      stores.dispose();

      // Check that stores are reset
      const [response] = stores.response;
      const [summary] = stores.summary;
      const [getReferenceMap] = stores.referenceMap;
      const [getHistoryEnable] = stores.referenceHistoryEnable;

      expect(response.details.dataKey).toBe('');
      expect(summary.answer).toBe(0);
      expect(getReferenceMap()).toEqual({});
      expect(getHistoryEnable()).toBe(false);
    });

    it('should reset reference store to initial state', () => {
      const [, setReference] = stores.reference;
      setReference('details', [{ dataKey: 'Q1' }]);
      setReference('sidebar', [{ name: 'Section 1' }]);

      stores.dispose();

      const [reference] = stores.reference;
      expect(reference.details).toEqual([]);
      expect(reference.sidebar).toEqual([]);
    });

    it('should reset all signals to initial state', () => {
      // Modify all signals
      stores.sidebarIndexMap[1]({ Q1: 0 });
      stores.compValidMap[1]({ Q1: ['Q2'] });
      stores.compSourceOptionMap[1]({ Q1: ['opt1'] });
      stores.compVarMap[1]({ Q1: ['var1'] });
      stores.compSourceQuestionMap[1]({ Q1: ['Q2'] });
      stores.sidebarHistory[1]([{ action: 'push' }]);

      stores.dispose();

      expect(stores.sidebarIndexMap[0]()).toEqual({});
      expect(stores.compValidMap[0]()).toEqual({});
      expect(stores.compSourceOptionMap[0]()).toEqual({});
      expect(stores.compVarMap[0]()).toEqual({});
      expect(stores.compSourceQuestionMap[0]()).toEqual({});
      expect(stores.sidebarHistory[0]()).toEqual([]);
    });

    it('should be safe to call multiple times', () => {
      stores.dispose();
      stores.dispose();
      stores.dispose();

      // Should not throw and stores should still be usable
      const [summary] = stores.summary;
      expect(summary.answer).toBe(0);
    });
  });

  describe('isolation', () => {
    it('should create independent store instances', () => {
      const stores1 = createFormStores();
      const stores2 = createFormStores();

      // Modify stores1
      stores1.summary[1]('answer', 10);
      stores1.referenceMap[1]({ Q1: 0 });

      // stores2 should be unaffected
      expect(stores2.summary[0].answer).toBe(0);
      expect(stores2.referenceMap[0]()).toEqual({});
    });

    it('should not share state between instances', () => {
      const stores1 = createFormStores({
        response: { dataKey: 'FORM_001' },
      });
      const stores2 = createFormStores({
        response: { dataKey: 'FORM_002' },
      });

      expect(stores1.response[0].details.dataKey).toBe('FORM_001');
      expect(stores2.response[0].details.dataKey).toBe('FORM_002');
    });

    it('should allow independent disposal', () => {
      const stores1 = createFormStores();
      const stores2 = createFormStores();

      stores1.summary[1]('answer', 10);
      stores2.summary[1]('answer', 20);

      stores1.dispose();

      // stores1 should be reset, stores2 should be unchanged
      expect(stores1.summary[0].answer).toBe(0);
      expect(stores2.summary[0].answer).toBe(20);
    });
  });
});
