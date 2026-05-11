'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit, Save, X } from 'lucide-react';

export default function EditMemberForm({ member }: { member: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: member.full_name || '',
    email: member.email || '',
    phone: member.phone || '',
    membership_status: member.membership_status || 'ACTIVE',
    current_plan_tier: member.current_plan_tier || 1,
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('members')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          membership_status: formData.membership_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      setSuccess('✅ Member updated successfully');
      setEditing(false);
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Member Information</h3>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 hover:bg-forest-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <p className="font-medium text-gray-900">{member.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium text-gray-900">{member.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <p className="font-medium text-gray-900">{member.phone || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Member Since</label>
            <p className="font-medium text-gray-900">
              {new Date(member.member_since).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Member ID</label>
            <p className="font-medium text-gray-900 font-mono text-sm">
              {member.id}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Edit Member</h3>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (Read-only)
          </label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Membership Status
          </label>
          <select
            value={formData.membership_status}
            onChange={(e) => setFormData({ ...formData, membership_status: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="GRACE">Grace Period</option>
            <option value="LOCKED">Locked</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ Changing status manually may affect payment processing
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
