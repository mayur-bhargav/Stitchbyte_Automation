"use client";
import React, { useState, useEffect } from 'react';
import {
  LuPlus,
  LuTrash2,
  LuPlay,
  LuPause,
  LuTarget,
  LuClock,
  LuTrendingUp,
  LuEye,
  LuMousePointer,
  LuMessageSquare,
  LuDollarSign,
  LuX,
  LuCopy,
  LuImage,
  LuVideo,
  LuFileText
} from 'react-icons/lu';

export type CampaignVariation = {
  id: string;
  name: string;
  message: string;
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    filename?: string;
  };
  ctaText?: string;
  ctaUrl?: string;
  trafficPercentage: number;
};

export type ABTestConfig = {
  name: string;
  description?: string;
  segmentId: string;
  testPercentage: number; // Percentage of segment to include in test
  durationHours: number;
  successMetric: 'read_rate' | 'ctr' | 'reply_rate' | 'conversion_rate';
  autoSendWinner: boolean;
  variations: CampaignVariation[];
};

export type ABTestResults = {
  testId: string;
  status: 'running' | 'completed' | 'paused';
  successMetric: 'read_rate' | 'ctr' | 'reply_rate' | 'conversion_rate';
  startedAt: string;
  endedAt?: string;
  timeRemaining?: number;
  variations: {
    id: string;
    name: string;
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replied: number;
    converted: number;
    metrics: {
      deliveryRate: number;
      readRate: number;
      ctr: number;
      replyRate: number;
      conversionRate: number;
    };
    isWinner?: boolean;
    confidenceLevel?: number;
  }[];
  winner?: string;
};

type ABTestBuilderProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testConfig: ABTestConfig) => void;
  onStart: (testId: string) => void;
  segments: Array<{ id: string; name: string; contactCount: number }>;
  initialTest?: ABTestConfig;
};

type ABTestMonitorProps = {
  isOpen: boolean;
  onClose: () => void;
  testResults: ABTestResults;
  onDeclareWinner: (testId: string, variationId: string) => void;
  onStopTest: (testId: string) => void;
};

const SUCCESS_METRICS = [
  { value: 'read_rate', label: 'Read Rate', icon: <LuEye className="w-4 h-4" /> },
  { value: 'ctr', label: 'Click-Through Rate', icon: <LuMousePointer className="w-4 h-4" /> },
  { value: 'reply_rate', label: 'Reply Rate', icon: <LuMessageSquare className="w-4 h-4" /> },
  { value: 'conversion_rate', label: 'Conversion Rate', icon: <LuDollarSign className="w-4 h-4" /> }
];

export function ABTestBuilder({ 
  isOpen, 
  onClose, 
  onSave, 
  onStart, 
  segments,
  initialTest 
}: ABTestBuilderProps) {
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [testPercentage, setTestPercentage] = useState(20);
  const [durationHours, setDurationHours] = useState(4);
  const [successMetric, setSuccessMetric] = useState<'read_rate' | 'ctr' | 'reply_rate' | 'conversion_rate'>('ctr');
  const [autoSendWinner, setAutoSendWinner] = useState(true);
  const [variations, setVariations] = useState<CampaignVariation[]>([]);

  useEffect(() => {
    if (initialTest) {
      setTestName(initialTest.name);
      setTestDescription(initialTest.description || '');
      setSelectedSegment(initialTest.segmentId);
      setTestPercentage(initialTest.testPercentage);
      setDurationHours(initialTest.durationHours);
      setSuccessMetric(initialTest.successMetric);
      setAutoSendWinner(initialTest.autoSendWinner);
      setVariations(initialTest.variations);
    } else {
      // Initialize with two empty variations
      setVariations([
        {
          id: generateId(),
          name: 'Variation A',
          message: '',
          trafficPercentage: 50
        },
        {
          id: generateId(),
          name: 'Variation B',
          message: '',
          trafficPercentage: 50
        }
      ]);
    }
  }, [initialTest, isOpen]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addVariation = () => {
    const newVariation: CampaignVariation = {
      id: generateId(),
      name: `Variation ${String.fromCharCode(65 + variations.length)}`,
      message: '',
      trafficPercentage: Math.floor(100 / (variations.length + 1))
    };

    // Redistribute traffic evenly
    const updatedVariations = [...variations, newVariation].map(variation => ({
      ...variation,
      trafficPercentage: Math.floor(100 / (variations.length + 1))
    }));

    setVariations(updatedVariations);
  };

  const removeVariation = (variationId: string) => {
    if (variations.length <= 2) return; // Minimum 2 variations required
    
    const updatedVariations = variations
      .filter(v => v.id !== variationId)
      .map(variation => ({
        ...variation,
        trafficPercentage: Math.floor(100 / (variations.length - 1))
      }));

    setVariations(updatedVariations);
  };

  const updateVariation = (variationId: string, updates: Partial<CampaignVariation>) => {
    setVariations(variations.map(variation => 
      variation.id === variationId ? { ...variation, ...updates } : variation
    ));
  };

  const duplicateVariation = (variationId: string) => {
    const originalVariation = variations.find(v => v.id === variationId);
    if (!originalVariation) return;

    const newVariation: CampaignVariation = {
      ...originalVariation,
      id: generateId(),
      name: `${originalVariation.name} Copy`
    };

    setVariations([...variations, newVariation]);
  };

  const selectedSegmentData = segments.find(s => s.id === selectedSegment);
  const testAudienceSize = selectedSegmentData 
    ? Math.floor(selectedSegmentData.contactCount * (testPercentage / 100))
    : 0;

  const isValidTest = () => {
    return testName.trim() && 
           selectedSegment && 
           variations.length >= 2 && 
           variations.every(v => v.message.trim());
  };

  const handleSave = () => {
    if (!isValidTest()) return;
    
    const testConfig: ABTestConfig = {
      name: testName,
      description: testDescription,
      segmentId: selectedSegment,
      testPercentage,
      durationHours,
      successMetric,
      autoSendWinner,
      variations
    };
    
    onSave(testConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {initialTest ? 'Edit A/B Test' : 'Create A/B Test'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Test different campaign variations to optimize performance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LuX className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* Test Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Holiday Sale Test"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Segment *
                  </label>
                  <select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  >
                    <option value="">Select segment...</option>
                    {segments.map(segment => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.contactCount.toLocaleString()} contacts)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    placeholder="Describe what you're testing..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Audience: {testPercentage}% ({testAudienceSize.toLocaleString()} contacts)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={testPercentage}
                    onChange={(e) => setTestPercentage(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Duration
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={48}>48 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Success Metric
                  </label>
                  <select
                    value={successMetric}
                    onChange={(e) => setSuccessMetric(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  >
                    {SUCCESS_METRICS.map(metric => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSendWinner"
                    checked={autoSendWinner}
                    onChange={(e) => setAutoSendWinner(e.target.checked)}
                    className="mr-3"
                  />
                  <label htmlFor="autoSendWinner" className="text-sm text-slate-700">
                    Automatically send winner to remaining audience
                  </label>
                </div>
              </div>
            </div>

            {/* Variations */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-800">Campaign Variations</h3>
                <button
                  onClick={addVariation}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <LuPlus className="w-4 h-4" />
                  Add Variation
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {variations.map((variation, index) => (
                  <div key={variation.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-800">{variation.name}</h4>
                        <span className="text-sm text-slate-500">
                          ({variation.trafficPercentage}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => duplicateVariation(variation.id)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                          title="Duplicate variation"
                        >
                          <LuCopy className="w-4 h-4" />
                        </button>
                        {variations.length > 2 && (
                          <button
                            onClick={() => removeVariation(variation.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Variation Name
                        </label>
                        <input
                          type="text"
                          value={variation.name}
                          onChange={(e) => updateVariation(variation.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          value={variation.message}
                          onChange={(e) => updateVariation(variation.id, { message: e.target.value })}
                          placeholder="Enter your message content..."
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Media (Optional)
                        </label>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                            <LuImage className="w-4 h-4" />
                            Image
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                            <LuVideo className="w-4 h-4" />
                            Video
                          </button>
                          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                            <LuFileText className="w-4 h-4" />
                            Document
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            CTA Text
                          </label>
                          <input
                            type="text"
                            value={variation.ctaText || ''}
                            onChange={(e) => updateVariation(variation.id, { ctaText: e.target.value })}
                            placeholder="e.g., Shop Now"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            CTA URL
                          </label>
                          <input
                            type="url"
                            value={variation.ctaUrl || ''}
                            onChange={(e) => updateVariation(variation.id, { ctaUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
              {selectedSegmentData && (
                <>
                  Testing {testAudienceSize.toLocaleString()} contacts 
                  ({(100 - testPercentage).toFixed(0)}% remaining for winner)
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValidTest()}
                className="px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                {initialTest ? 'Update Test' : 'Start A/B Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ABTestMonitor({ 
  isOpen, 
  onClose, 
  testResults, 
  onDeclareWinner, 
  onStopTest 
}: ABTestMonitorProps) {
  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}m remaining`;
    }
    return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m remaining`;
  };

  const getLeadingVariation = () => {
    return testResults.variations.reduce((prev, current) => {
      const prevMetric = prev.metrics[testResults.successMetric as keyof typeof prev.metrics] || 0;
      const currentMetric = current.metrics[testResults.successMetric as keyof typeof current.metrics] || 0;
      return currentMetric > prevMetric ? current : prev;
    });
  };

  const leader = getLeadingVariation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                A/B Test Monitor
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  testResults.status === 'running' ? 'bg-green-100 text-green-700' :
                  testResults.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    testResults.status === 'running' ? 'bg-green-500' :
                    testResults.status === 'completed' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                  {testResults.status === 'running' ? 'Running' : 
                   testResults.status === 'completed' ? 'Completed' : 'Paused'}
                </div>
                {testResults.timeRemaining && testResults.status === 'running' && (
                  <span className="text-sm text-slate-500">
                    {formatTimeRemaining(testResults.timeRemaining)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testResults.status === 'running' && (
                <>
                  <button
                    onClick={() => onStopTest(testResults.testId)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                  >
                    Stop Test
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LuX className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* Current Leader */}
            {testResults.status === 'running' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <LuTarget className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-medium text-emerald-800">
                      Current Leader: {leader.name}
                    </h3>
                    <p className="text-sm text-emerald-600">
                      {SUCCESS_METRICS.find(m => m.value === testResults.successMetric)?.label}: {
                        (leader.metrics[testResults.successMetric as keyof typeof leader.metrics] * 100).toFixed(1)
                      }%
                      {leader.confidenceLevel && (
                        <span className="ml-2">
                          (Confidence: {leader.confidenceLevel}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="font-medium text-slate-800">Test Results</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">
                        Variation
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        Sent
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        Delivered
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        Read
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        Clicked
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        CTR
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">
                        Winner
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {testResults.variations.map((variation) => (
                      <tr key={variation.id} className={variation.isWinner ? 'bg-emerald-50' : ''}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {variation.name}
                            </span>
                            {variation.isWinner && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                Winner ⭐
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center px-6 py-4 text-slate-600">
                          {variation.sent.toLocaleString()}
                        </td>
                        <td className="text-center px-6 py-4">
                          <div>
                            <div className="text-slate-800">
                              {variation.delivered.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(variation.metrics.deliveryRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-6 py-4">
                          <div>
                            <div className="text-slate-800">
                              {variation.read.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(variation.metrics.readRate * 100).toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-6 py-4">
                          <div>
                            <div className="text-slate-800">
                              {variation.clicked.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(variation.metrics.ctr * 100).toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-6 py-4">
                          <span className={`font-medium ${
                            variation.id === leader.id ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {(variation.metrics.ctr * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center px-6 py-4">
                          {testResults.status === 'running' && !testResults.winner && (
                            <button
                              onClick={() => onDeclareWinner(testResults.testId, variation.id)}
                              className="px-3 py-1 text-sm bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded transition-colors"
                            >
                              Declare Winner
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
