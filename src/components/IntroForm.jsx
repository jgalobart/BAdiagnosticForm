import { useState } from 'react';
import { ChevronRight, Building2, User, Phone, Mail, MapPin } from 'lucide-react';

export default function IntroForm({ intro, onComplete }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    intro.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.id] = 'Aquest camp és obligatori';
        }
      }
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Introdueix un email vàlid';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onComplete(formData);
    }
  };

  const shouldShowField = (field) => {
    if (!field.show_if) return true;
    return formData[field.show_if.field_id] === field.show_if.equals;
  };

  const getIcon = (fieldId) => {
    const icons = {
      business_name: Building2,
      contact_name: User,
      phone: Phone,
      email: Mail,
      address: MapPin,
    };
    return icons[fieldId] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">Comerç a Punt</h1>
            <p className="text-blue-100 text-lg">Qüestionari digital d'autoavaluació</p>
            <div className="mt-4 flex items-center gap-2 text-blue-200 text-sm">
              <span className="bg-blue-500/30 px-3 py-1 rounded-full">⏱️ ~20 minuts</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <p className="text-gray-600 mb-6">
              Abans de començar, necessitem algunes dades del teu negoci per personalitzar l'informe.
            </p>

            {intro.fields.map(field => {
              if (!shouldShowField(field)) return null;
              const Icon = getIcon(field.id);

              return (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'text' || field.type === 'email' ? (
                    <div className="relative">
                      {Icon && (
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      )}
                      <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors[field.id] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={field.label}
                      />
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white ${
                        errors[field.id] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecciona una opció...</option>
                      {field.options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[field.id] || false}
                        onChange={(e) => handleChange(field.id, e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">{field.label}</span>
                    </label>
                  ) : null}

                  {errors[field.id] && (
                    <p className="text-red-500 text-sm">{errors[field.id]}</p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Començar el qüestionari
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
