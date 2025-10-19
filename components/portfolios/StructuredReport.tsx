"use client"

import React from 'react'
import { StructuredReport as StructuredReportType } from '@/lib/api/backtests'

interface StructuredReportProps {
  report: StructuredReportType
}

export function StructuredReportComponent({ report }: StructuredReportProps) {
  const { title, summary, disclaimer } = report

  // Helper function to format percentage values by multiplying by 100
  const formatPercentage = (value: string | number) => {
    if (typeof value === 'string') {
      // If value already contains % but looks like a decimal (e.g., "-0.26%")
      // Remove % and check if it looks like it needs to be multiplied by 100
      if (value.includes('%')) {
        const numericPart = value.replace('%', '');
        const num = parseFloat(numericPart);
        if (!isNaN(num)) {
          // If the number is between -1 and 1, it's likely a ratio that needs *100
          // If it's greater than 1 or less than -1, it's already a percentage
          if (num >= -1 && num <= 1 && num !== 0) {
            return (num * 100).toFixed(2) + '%';
          }
          return value; // Already a proper percentage
        }
        return value;
      }
      // No % in string
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return (num * 100).toFixed(2) + '%';
      }
      return value;
    }
    if (typeof value === 'number') {
      return (value * 100).toFixed(2) + '%';
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-8">
      {title && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1f2937] mb-2">{title}</h1>
        </div>
      )}

      {/* Overall Performance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#1f2937] border-b border-gray-200 pb-2">
          {summary.overall_performance.headline}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-800 mb-2">총 수익률</h3>
            <p className="text-2xl font-bold text-blue-900 mb-2">{summary.overall_performance.total_return.value}</p>
            <p className="text-sm text-blue-700">{summary.overall_performance.total_return.interpretation}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-2">샤프 비율</h3>
            <p className="text-2xl font-bold text-green-900 mb-2">{summary.overall_performance.sharpe_ratio.value}</p>
            <p className="text-sm text-green-700">{summary.overall_performance.sharpe_ratio.interpretation}</p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-lg font-medium text-red-800 mb-2">최대 낙폭</h3>
            <p className="text-2xl font-bold text-red-900 mb-2">{summary.overall_performance.max_drawdown.value}</p>
            <p className="text-sm text-red-700">{summary.overall_performance.max_drawdown.interpretation}</p>
          </div>
        </div>
      </section>

      {/* Excess Return */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#1f2937] border-b border-gray-200 pb-2">
          {summary.excess_return.headline}
        </h2>
        
        <div className="grid md:grid-cols-1 gap-6">
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="text-lg font-medium text-indigo-800 mb-2">벤치마크 대비 성과</h3>
            <div className="space-y-2">
              <p className="text-sm text-indigo-700">
                <span className="font-medium">벤치마크 수익률:</span> {summary.excess_return.benchmark_comparison.benchmark_return}
              </p>
              <p className="text-sm text-indigo-700">
                <span className="font-medium">초과 성과:</span> {summary.excess_return.benchmark_comparison.excess_value}
              </p>
              <p className="text-sm text-indigo-700">{summary.excess_return.benchmark_comparison.interpretation}</p>
            </div>
          </div>
        </div>
      </section>



      {/* Diversification Effect */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#1f2937] border-b border-gray-200 pb-2">
          {summary.diversification_effect.headline}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-medium text-orange-800 mb-3">개별 투자</h3>
            <p className="text-sm text-orange-700 mb-2">{summary.diversification_effect.individual_vs_portfolio.individual_investment.description}</p>
            <p className="text-sm text-orange-700">{summary.diversification_effect.individual_vs_portfolio.individual_investment.analysis}</p>
          </div>
          
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="text-lg font-medium text-teal-800 mb-3">포트폴리오 투자</h3>
            <p className="text-sm text-teal-700 mb-2">{summary.diversification_effect.individual_vs_portfolio.portfolio_investment.description}</p>
            <p className="text-sm text-teal-700">{summary.diversification_effect.individual_vs_portfolio.portfolio_investment.analysis}</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-3">분산투자 이점</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-yellow-800">위험 감소 효과</p>
              <p className="text-sm text-yellow-700">{summary.diversification_effect.diversification_benefits.risk_reduction}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">수익 안정성</p>
              <p className="text-sm text-yellow-700">{summary.diversification_effect.diversification_benefits.return_stability}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">상관관계 분석</p>
              <p className="text-sm text-yellow-700">{summary.diversification_effect.diversification_benefits.correlation_analysis}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#1f2937] border-b border-gray-200 pb-2">
          {summary.recommendations.headline}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-3">강점</h3>
              <ul className="space-y-2">
                {summary.recommendations.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-medium text-red-800 mb-3">개선점</h3>
              <ul className="space-y-2">
                {summary.recommendations.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start">
                    <span className="text-red-600 mr-2">⚠</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-3">개선 방안</h3>
              <ul className="space-y-2">
                {summary.recommendations.actionable_recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="text-blue-600 mr-2">→</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="text-lg font-medium text-indigo-800 mb-2">투자 가이드</h3>
          <p className="text-sm text-indigo-700">{summary.recommendations.investment_guidance}</p>
        </div>
      </section>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 italic">{disclaimer}</p>
        </div>
      )}
    </div>
  )
}
