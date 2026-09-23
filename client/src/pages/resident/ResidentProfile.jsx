import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import DataState from '../../components/DataState.jsx';
import DocumentsSection from '../../components/DocumentsSection.jsx';
import { residentApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const toDate = (v) => (v ? String(v).slice(0, 10) : '');
const BLOOD = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Field({ register, name, label, required, type = 'text', ...rest }) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</span>
      <input type={type} className="field" aria-required={required || undefined} {...register(name)} {...rest} />
    </label>
  );
}

function Form({ data, reload }) {
  const { t } = useTranslation();
  const { resident, requiredFields, missingFields } = data;
  const req = (k) => requiredFields.includes(k);
  const [error, setError] = useState(null);
  const locked = resident.status === 'archived';

  const { register, handleSubmit, formState: { isSubmitting, isDirty }, reset } = useForm({
    defaultValues: {
      fullName: resident.fullName, photoUrl: resident.photoUrl, fatherName: resident.fatherName, motherName: resident.motherName,
      dateOfBirth: toDate(resident.dateOfBirth), phone: resident.phone, email: resident.email,
      ecName: resident.emergencyContact?.name || '', ecPhone: resident.emergencyContact?.phone || '', ecRelation: resident.emergencyContact?.relation || '',
      gName: resident.guardian?.name || '', gPhone: resident.guardian?.phone || '', gRelation: resident.guardian?.relation || '',
      permanentAddress: resident.permanentAddress, presentAddress: resident.presentAddress, nationality: resident.nationality,
      occupation: resident.occupation, institution: resident.institution, department: resident.department, bloodGroup: resident.bloodGroup,
      expectedLeavingDate: toDate(resident.expectedLeavingDate), notes: resident.notes,
    },
  });

  const onSubmit = async (v) => {
    setError(null);
    const body = {
      photoUrl: v.photoUrl, fatherName: v.fatherName, motherName: v.motherName, phone: v.phone, email: v.email,
      dateOfBirth: v.dateOfBirth || null, expectedLeavingDate: v.expectedLeavingDate || null,
      emergencyContact: { name: v.ecName, phone: v.ecPhone, relation: v.ecRelation },
      guardian: { name: v.gName, phone: v.gPhone, relation: v.gRelation },
      permanentAddress: v.permanentAddress, presentAddress: v.presentAddress, nationality: v.nationality,
      occupation: v.occupation, institution: v.institution, department: v.department, bloodGroup: v.bloodGroup, notes: v.notes,
    };
    try {
      await residentApi.updateMe(body);
      toast.success(t('resident.saved'));
      reset(v);
      reload();
    } catch (err) {
      setError(getFieldErrors(err).map((e) => `${e.field}: ${e.message}`).join(' · ') || getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {missingFields.length > 0 && <Alert tone="info" title={t('resident.stillNeeded')}>{missingFields.map((k) => t(`resident.fields.${k}`)).join(', ')}</Alert>}
      <p className="text-xs text-slate-500">{t('resident.privacyNote')}</p>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">{t('resident.sections.personal')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">{t('common.name')}</span><input className="field" value={resident.fullName} disabled readOnly /></label>
          <Field register={register} name="dateOfBirth" type="date" label={t('resident.fields.dateOfBirth')} required={req('dateOfBirth')} />
          <Field register={register} name="fatherName" label={t('resident.fields.fatherName')} required={req('fatherName')} />
          <Field register={register} name="motherName" label={t('resident.fields.motherName')} required={req('motherName')} />
          <Field register={register} name="nationality" label={t('resident.fields.nationality')} required={req('nationality')} />
          <label className="block"><span className="label">{t('resident.fields.bloodGroup')}{req('bloodGroup') && <span className="ml-0.5 text-red-600">*</span>}</span>
            <select className="field" {...register('bloodGroup')}>{BLOOD.map((b) => <option key={b} value={b}>{b || '—'}</option>)}</select></label>
          <Field register={register} name="phone" type="tel" label={t('common.phone')} required={req('phone')} />
          <Field register={register} name="email" type="email" label={t('common.email')} required={req('email')} />
          <Field register={register} name="photoUrl" label={t('resident.fields.photoUrl')} required={req('photoUrl')} placeholder="https://…" />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">{t('resident.sections.contacts')}</h2>
        <p className="text-sm font-medium">{t('resident.fields.emergencyContact')}{req('emergencyContact') && <span className="ml-0.5 text-red-600">*</span>}</p>
        <div className="grid gap-4 sm:grid-cols-3"><Field register={register} name="ecName" label={t('common.name')} /><Field register={register} name="ecPhone" type="tel" label={t('common.phone')} /><Field register={register} name="ecRelation" label={t('resident.relation')} /></div>
        <p className="text-sm font-medium">{t('resident.fields.guardian')}{req('guardian') && <span className="ml-0.5 text-red-600">*</span>}</p>
        <div className="grid gap-4 sm:grid-cols-3"><Field register={register} name="gName" label={t('common.name')} /><Field register={register} name="gPhone" type="tel" label={t('common.phone')} /><Field register={register} name="gRelation" label={t('resident.relation')} /></div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">{t('resident.sections.address')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field register={register} name="permanentAddress" label={t('resident.fields.permanentAddress')} required={req('permanentAddress')} />
          <Field register={register} name="presentAddress" label={t('resident.fields.presentAddress')} required={req('presentAddress')} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">{t('resident.sections.study')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field register={register} name="occupation" label={t('resident.fields.occupation')} required={req('occupation')} />
          <Field register={register} name="institution" label={t('resident.fields.institution')} required={req('institution')} />
          <Field register={register} name="department" label={t('resident.fields.department')} required={req('department')} />
          <Field register={register} name="expectedLeavingDate" type="date" label={t('resident.fields.expectedLeavingDate')} required={req('expectedLeavingDate')} />
        </div>
        <label className="block"><span className="label">{t('bookings.notes')}</span><textarea rows={2} maxLength={1000} className="field" {...register('notes')} /></label>
      </section>

      <div className="flex items-center justify-between gap-3">
        <Badge tone={resident.status === 'verified' ? 'green' : 'amber'}>{t(`resident.status.${resident.status}`)}</Badge>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty || locked}>{t('common.save')}</Button>
      </div>
    </form>
  );
}

export default function ResidentProfile() {
  const { t } = useTranslation();
  const { data, loading, error, notFound, reload } = useFetch(() => residentApi.me(), []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('resident.profileTitle')}</h1>
      <DataState loading={loading} error={error} empty={notFound} onRetry={reload} skeletons={2} skeletonClass="h-48">
        {data && <><Form key={data.resident.updatedAt} data={data} reload={reload} />{data.resident.status !== 'archived' && <DocumentsSection />}</>}
      </DataState>
    </div>
  );
}
