'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unitNumber: string;
  verificationStatus: string;
  isResident: boolean;
  isOwner: boolean;
  isVerifier: boolean;
  createdAt: string;
}

const pageStyle: React.CSSProperties = {
  maxWidth: '700px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '24px',
};

const formCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '24px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const readOnlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: '#f5f5f5',
  color: '#666',
  cursor: 'not-allowed',
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  marginTop: '8px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.95rem',
  color: '#333',
  cursor: 'pointer',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#6b7280',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const errorStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const successStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#f0fdf4',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  marginBottom: '16px',
};

const warningStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  marginBottom: '16px',
};

const statusBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 100,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '500px',
  width: '90%',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: '#92400e',
  marginBottom: '12px',
};

const modalButtonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '20px',
};

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [isResident, setIsResident] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setPhone(data.user.phone);
        setUnitNumber(data.user.unitNumber);
        setIsResident(data.user.isResident);
        setIsOwner(data.user.isOwner);
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  const hasChanges = () => {
    if (!profile) return false;
    return (
      firstName !== profile.firstName ||
      lastName !== profile.lastName ||
      phone !== profile.phone ||
      unitNumber.toUpperCase() !== profile.unitNumber ||
      isResident !== profile.isResident ||
      isOwner !== profile.isOwner
    );
  };

  const willRequireReverify = () => {
    if (!profile || profile.verificationStatus !== 'verified') return false;
    if (profile.isVerifier) return false;
    return hasChanges();
  };

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone);
      setUnitNumber(profile.unitNumber);
      setIsResident(profile.isResident);
      setIsOwner(profile.isOwner);
    }
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSaveClick = () => {
    if (!isResident && !isOwner) {
      setError('At least one of Resident or Owner must be selected.');
      return;
    }

    if (willRequireReverify()) {
      setShowConfirm(true);
    } else {
      doSave();
    }
  };

  const doSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setShowConfirm(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          unitNumber,
          isResident,
          isOwner,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      if (data.reverify) {
        setSuccess('Profile updated. Your account has been set to pending re-verification. You will be notified once your profile has been reviewed.');
      } else {
        setSuccess(data.message);
      }

      setEditing(false);
      // Refresh profile data
      await fetchProfile();
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>My Profile</h1>
        <p style={{ color: '#666' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>My Profile</h1>
        <div style={errorStyle}>Failed to load profile data.</div>
      </div>
    );
  }

  const statusColor = profile.verificationStatus === 'verified' ? '#166534' :
    profile.verificationStatus === 'pending' ? '#92400e' : '#b91c1c';
  const statusBg = profile.verificationStatus === 'verified' ? '#dcfce7' :
    profile.verificationStatus === 'pending' ? '#fef3c7' : '#fef2f2';

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>My Profile</h1>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={formCardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ ...statusBadgeStyle, backgroundColor: statusBg, color: statusColor }}>
            {profile.verificationStatus.charAt(0).toUpperCase() + profile.verificationStatus.slice(1)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>First Name</label>
            {editing ? (
              <input
                type="text"
                style={inputStyle}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                maxLength={100}
              />
            ) : (
              <input type="text" style={readOnlyInputStyle} value={profile.firstName} readOnly />
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Last Name</label>
            {editing ? (
              <input
                type="text"
                style={inputStyle}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                maxLength={100}
              />
            ) : (
              <input type="text" style={readOnlyInputStyle} value={profile.lastName} readOnly />
            )}
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Email</label>
          <input type="email" style={readOnlyInputStyle} value={profile.email} readOnly />
          {editing && (
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
              Email cannot be changed through profile edit. Contact an administrator.
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Phone</label>
            {editing ? (
              <input
                type="tel"
                style={inputStyle}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            ) : (
              <input type="text" style={readOnlyInputStyle} value={profile.phone} readOnly />
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Unit Number</label>
            {editing ? (
              <input
                type="text"
                style={inputStyle}
                value={unitNumber}
                onChange={e => setUnitNumber(e.target.value)}
                maxLength={6}
              />
            ) : (
              <input type="text" style={readOnlyInputStyle} value={profile.unitNumber} readOnly />
            )}
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Residency Status</label>
          {editing ? (
            <div style={checkboxRowStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={isResident}
                  onChange={e => setIsResident(e.target.checked)}
                />
                Resident
              </label>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={isOwner}
                  onChange={e => setIsOwner(e.target.checked)}
                />
                Owner
              </label>
            </div>
          ) : (
            <div style={{ fontSize: '0.95rem', color: '#555', padding: '10px 0' }}>
              {[
                profile.isResident ? 'Resident' : null,
                profile.isOwner ? 'Owner' : null,
              ].filter(Boolean).join(', ') || 'None'}
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>
          Member since: {new Date(profile.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>

        {editing && willRequireReverify() && (
          <div style={warningStyle}>
            These changes will require your account to be re-verified. You will not be able to access protected content until a verifier reviews your updated information.
          </div>
        )}

        <div style={buttonRowStyle}>
          {editing ? (
            <>
              <button
                style={{ ...cancelButtonStyle, ...(saving ? disabledButtonStyle : {}) }}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                style={{
                  ...saveButtonStyle,
                  ...(saving || !hasChanges() ? disabledButtonStyle : {}),
                }}
                onClick={handleSaveClick}
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button style={saveButtonStyle} onClick={() => { setEditing(true); setSuccess(''); setError(''); }}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Re-verification confirmation dialog */}
      {showConfirm && (
        <div style={modalOverlayStyle} onClick={() => setShowConfirm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={modalTitleStyle}>Re-verification Required</div>
            <p style={{ color: '#555', lineHeight: '1.6', marginBottom: '8px' }}>
              The changes you are making require your account to be re-verified. This means:
            </p>
            <ul style={{ color: '#555', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '16px' }}>
              <li>Your account status will change to &ldquo;pending&rdquo;</li>
              <li>You will lose access to protected content until re-verified</li>
              <li>A verifier will review your updated information</li>
            </ul>
            <p style={{ color: '#555', fontWeight: 'bold' }}>
              Do you want to proceed with these changes?
            </p>
            <div style={modalButtonRowStyle}>
              <button
                style={cancelButtonStyle}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...saveButtonStyle, backgroundColor: '#92400e' }}
                onClick={doSave}
              >
                Proceed with Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
