import React from 'react';
import { ShieldAlert, X, AlertTriangle, Stethoscope, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalDisclaimerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, padding: '20px' }}>
      <div className="glass-panel max-w-xl w-full p-6 relative overflow-hidden" style={{ maxWidth: '580px', width: '100%', padding: '28px', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)' }}>
        
        {/* Glowing header accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #06b6d4 100%)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Medical Information & Safety Policy
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Important User Guidelines</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1' }}>
          
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', gap: '12px' }}>
            <AlertTriangle size={20} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fb7185', display: 'block', marginBottom: '4px' }}>Not a Diagnostic Medical Device</strong>
              MediQuery is an AI retrieval tool designed strictly to help you locate and understand information in your uploaded health documents. It does not provide medical diagnoses, treatment decisions, or medical advice.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: '#f8fafc' }}>Always Consult a Licensed Physician:</strong> Never ignore professional clinical guidance or delay seeking medical attention based on information retrieved by this software.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: '#f8fafc' }}>Strict Source Grounding:</strong> Answers cite specific document pages. You can verify every answer against your original laboratory report directly in the document inspector.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: '#f8fafc' }}>Reference Interval Variations:</strong> Lab reference intervals vary between testing facilities and assay methodologies. Always refer to the reference ranges printed on your specific lab sheet.
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope size={20} color="#38bdf8" />
            <span style={{ fontSize: '13px', color: '#bae6fd' }}>
              In case of a medical emergency, call your local emergency services (e.g. 911, 112, 999) or visit the nearest emergency room immediately.
            </span>
          </div>

        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
