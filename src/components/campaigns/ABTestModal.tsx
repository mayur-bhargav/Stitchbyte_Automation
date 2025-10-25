"use client";
import React, { useState, useEffect } from 'react';
import { LuTestTube, LuX, LuPlus, LuTrash2, LuRefreshCw } from 'react-icons/lu';
import { apiService } from '../../app/services/apiService';

interface ABTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId: string | null;
}

interface Variant {
  name: string;
  message: string;
  media_url?: string;
  buttons?: Array<{text: string, url?: string}>;
}

export default function ABTestModal({ isOpen, onClose, onSuccess, campaignId }: ABTestModalProps) {
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [segments, setSegments] = useState<any[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { name: 'Variant A', message: '' },
    { name: 'Variant B', message: '' },
  ]);
  const [splitPercentages, setSplitPercentages] = useState<number[]>([40, 40]);
  const [testDuration, setTestDuration] = useState(24);
  const [winnerMetric, setWinnerMetric] = useState('reply_rate');
  const [loading, setLoading] = useState(false);

  const reservedPercentage = 100 - splitPercentages.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen]);

  const loadSegments = async () => {
    try {
      const response = await apiService.get('/segments/');
      setSegments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  };

  const addVariant = () => {
    const newVariants = [...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, message: '' }];
    const newSplits = [...splitPercentages, 0];
    setVariants(newVariants);
    setSplitPercentages(newSplits);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((_, i) => i !== index));
    setSplitPercentages(splitPercentages.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, value: number) => {
    const newSplits = [...splitPercentages];
    newSplits[index] = Math.max(0, Math.min(100, value));
    setSplitPercentages(newSplits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (splitPercentages.reduce((a, b) => a + b, 0) > 100) {
      alert('Total percentage cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);
      await apiService.post('/ab-tests/', {
        name,
        campaign_id: campaignId,
        segment_id: segmentId,
        variants,
        split_percentages: splitPercentages,
        test_duration_hours: testDuration,
        winner_metric: winnerMetric,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating A/B test:', error);
      alert(error.message || 'Failed to create A/B test');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-white/30 backdrop-blur-md" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <LuTestTube className="text-2xl text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create A/B Test</h2>
                <p className="text-sm text-gray-600 mt-1">Test multiple message variants</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <LuX className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Holiday Sale Test" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segment *</label>
                <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">Select segment</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.id}>{seg.name} ({seg.user_count} contacts)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Message Variants</label>
                <button type="button" onClick={addVariant}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1">
                  <LuPlus className="text-sm" />
                  <span>Add Variant</span>
                </button>
              </div>

              {variants.map((variant, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <input type="text" value={variant.name}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index].name = e.target.value;
                        setVariants(newVariants);
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg mr-2"
                      placeholder="Variant name" />
                    <div className="flex items-center space-x-2">
                      <input type="number" value={splitPercentages[index]}
                        onChange={(e) => updateSplit(index, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0" max="100" />
                      <span className="text-gray-600">%</span>
                      {variants.length > 2 && (
                        <button type="button" onClick={() => removeVariant(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <LuTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea value={variant.message}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].message = e.target.value;
                      setVariants(newVariants);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter message content"
                    rows={3}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-blue-900 font-medium">Reserved for winner:</span>
                <span className="text-2xl font-bold text-blue-600">{reservedPercentage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Duration (hours)</label>
                <input type="number" value={testDuration} onChange={(e) => setTestDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg" min="1" max="168" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Winner Metric</label>
                <select value={winnerMetric} onChange={(e) => setWinnerMetric(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg">
                  <option value="reply_rate">Reply Rate</option>
                  <option value="ctr">Click-Through Rate</option>
                  <option value="delivery_rate">Delivery Rate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center space-x-2">
                {loading && <LuRefreshCw className="animate-spin" />}
                <span>Create A/B Test</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
