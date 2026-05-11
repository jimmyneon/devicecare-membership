'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Calendar } from 'lucide-react';

export default function ServiceHistoryList({ services }: { services: any[] }) {
  if (!services || services.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No services yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Services will appear here when credit is used
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div
          key={service.id}
          className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(Math.abs(service.amount))} service
                </p>
                {service.repair_id && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Repair #{service.repair_id.substring(0, 8)}
                  </span>
                )}
              </div>
              
              {service.notes && (
                <p className="text-sm text-gray-600 mb-2">{service.notes}</p>
              )}
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(service.created_at)}
                </span>
                {service.subscription_id && (
                  <>
                    <span>•</span>
                    <span>Sub: {service.subscription_id.substring(0, 8)}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">
                -{formatCurrency(Math.abs(service.amount))}
              </p>
              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(service.balance_after)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
