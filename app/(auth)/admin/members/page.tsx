'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function MembersListPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, statusFilter, members]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('role', 'CUSTOMER')
        .order('member_since', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.full_name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(m => m.membership_status === statusFilter);
    }

    setFilteredMembers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'GRACE': return 'bg-yellow-100 text-yellow-800';
      case 'LOCKED': return 'bg-red-100 text-red-800';
      case 'PAUSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          All Members
        </h1>
        <p className="text-gray-600">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-forest-700 focus:outline-none bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="GRACE">Grace Period</option>
            <option value="LOCKED">Locked</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-forest-700 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-3">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'No members found matching your filters'
              : 'No members yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <Link
              key={member.id}
              href={`/admin/members/${member.id}`}
              className="block bg-white rounded-xl border-2 border-gray-200 hover:border-forest-700 p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {member.full_name || 'No name'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(member.membership_status)}`}>
                      {member.membership_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-2">{member.email}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>ID: {member.id.substring(0, 8).toUpperCase()}</span>
                    <span>•</span>
                    <span>Credit: {formatCurrency(member.current_credit_balance)}</span>
                    <span>•</span>
                    <span>Tier {member.current_plan_tier}</span>
                  </div>
                </div>

                {(member.membership_status === 'GRACE' || member.membership_status === 'LOCKED') && (
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                    member.membership_status === 'LOCKED' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
