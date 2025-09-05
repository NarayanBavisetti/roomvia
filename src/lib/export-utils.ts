interface MarketInsightsData {
  totalSearches: number
  uniqueUsers: number
  topProperty: string
  topLocation: string
  propertyTypeDemand: Array<{
    property_type: string
    search_count: number
    percentage: number
  }>
  amenitiesRanking: Array<{
    amenity: string
    usage_count: number
  }>
  budgetDistribution: {
    '< ₹15k': number
    '₹15k-25k': number
    '₹25k-40k': number
    '> ₹40k': number
  }
  popularAreas: Array<{
    area: string
    search_count: number
  }>
  demographics: {
    malePercentage: number
    femalePercentage: number
    brokerPreference: number
    noBrokerPreference: number
  }
  occupancyPreferences: Array<{
    occupancy: string
    count: number
  }>
  lifestylePreferences: Array<{
    lifestyle: string
    count: number
  }>
}

interface MarketInsightsResponse {
  success: boolean
  data: MarketInsightsData
  aiInsights: string
  actionableRecommendations: string[]
  confidence: number
  metadata: {
    city: string
    timePeriod: string
    totalFilterRecords: number
    analysisDate: string
    fallbackUsed: boolean
  }
}

export function exportToCSV(marketData: MarketInsightsResponse): void {
  try {
    const csvContent = generateCSVContent(marketData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `market-insights-${marketData.metadata.city}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error exporting CSV:', error)
    throw new Error('Failed to export CSV')
  }
}

function generateCSVContent(marketData: MarketInsightsResponse): string {
  const { data, metadata, confidence, actionableRecommendations } = marketData
  
  let csv = ''
  
  // Header Information
  csv += `Market Insights Report\n`
  csv += `City,${metadata.city}\n`
  csv += `Time Period,${metadata.timePeriod}\n`
  csv += `Analysis Date,${new Date(metadata.analysisDate).toLocaleDateString()}\n`
  csv += `Total Data Points,${metadata.totalFilterRecords}\n`
  csv += `Confidence Level,${Math.round(confidence * 100)}%\n`
  csv += `Analysis Type,${metadata.fallbackUsed ? 'Statistical' : 'AI-Powered'}\n`
  csv += `\n`

  // Overview Metrics
  csv += `OVERVIEW METRICS\n`
  csv += `Metric,Value\n`
  csv += `Total Searches,${data.totalSearches}\n`
  csv += `Unique Users,${data.uniqueUsers}\n`
  csv += `Top Property Type,${data.topProperty}\n`
  csv += `Top Location,${data.topLocation}\n`
  csv += `\n`

  // Property Type Demand
  csv += `PROPERTY TYPE DEMAND\n`
  csv += `Property Type,Search Count,Percentage\n`
  data.propertyTypeDemand.forEach(item => {
    csv += `${item.property_type},${item.search_count},${item.percentage}%\n`
  })
  csv += `\n`

  // Budget Distribution
  csv += `BUDGET DISTRIBUTION\n`
  csv += `Budget Range,Search Count\n`
  Object.entries(data.budgetDistribution).forEach(([range, count]) => {
    csv += `${range},${count}\n`
  })
  csv += `\n`

  // Popular Areas
  csv += `POPULAR AREAS\n`
  csv += `Area,Search Count\n`
  data.popularAreas.forEach(item => {
    csv += `${item.area},${item.search_count}\n`
  })
  csv += `\n`

  // Top Amenities
  csv += `TOP AMENITIES\n`
  csv += `Amenity,Usage Count\n`
  data.amenitiesRanking.forEach(item => {
    csv += `${item.amenity},${item.usage_count}\n`
  })
  csv += `\n`

  // Demographics
  csv += `DEMOGRAPHICS\n`
  csv += `Category,Percentage\n`
  csv += `Male Preference,${data.demographics.malePercentage}%\n`
  csv += `Female Preference,${data.demographics.femalePercentage}%\n`
  csv += `Broker Preference,${data.demographics.brokerPreference}%\n`
  csv += `No Broker Preference,${data.demographics.noBrokerPreference}%\n`
  csv += `\n`

  // Occupancy Preferences
  if (data.occupancyPreferences.length > 0) {
    csv += `OCCUPANCY PREFERENCES\n`
    csv += `Occupancy Type,Count\n`
    data.occupancyPreferences.forEach(item => {
      csv += `${item.occupancy},${item.count}\n`
    })
    csv += `\n`
  }

  // Lifestyle Preferences
  if (data.lifestylePreferences.length > 0) {
    csv += `LIFESTYLE PREFERENCES\n`
    csv += `Lifestyle,Count\n`
    data.lifestylePreferences.forEach(item => {
      csv += `${item.lifestyle},${item.count}\n`
    })
    csv += `\n`
  }

  // Recommendations
  csv += `ACTIONABLE RECOMMENDATIONS\n`
  csv += `Recommendation\n`
  actionableRecommendations.forEach(rec => {
    csv += `"${rec.replace(/"/g, '""')}"\n`
  })

  return csv
}

export async function exportToPDF(marketData: MarketInsightsResponse): Promise<void> {
  try {
    // For now, we'll generate an HTML version that can be printed to PDF
    // In a production environment, you'd want to use a proper PDF library like jsPDF or Puppeteer
    const htmlContent = generatePDFHTML(marketData)
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `market-insights-${marketData.metadata.city}-${new Date().toISOString().split('T')[0]}.html`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

function generatePDFHTML(marketData: MarketInsightsResponse): string {
  const { data, metadata, confidence, aiInsights, actionableRecommendations } = marketData
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Insights Report - ${metadata.city}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 40px; 
            color: #1f2937; 
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .title { 
            color: #7c3aed; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .subtitle { 
            color: #6b7280; 
            font-size: 16px; 
        }
        .metadata { 
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .section { 
            margin: 30px 0; 
        }
        .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 15px;
            border-left: 4px solid #7c3aed;
            padding-left: 12px;
        }
        .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
        }
        .metric-card { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1f2937; 
        }
        .metric-label { 
            color: #6b7280; 
            font-size: 14px; 
            margin-top: 5px; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
        }
        th, td { 
            border: 1px solid #e5e7eb; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background: #f3f4f6; 
            font-weight: bold; 
        }
        .insights { 
            background: linear-gradient(to right, #fdf4ff, #eff6ff); 
            border: 1px solid #c084fc; 
            border-radius: 8px; 
            padding: 25px; 
            margin: 20px 0; 
        }
        .recommendation { 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 10px 0; 
            border-left: 4px solid #22c55e;
        }
        .chart-placeholder {
            background: #f9fafb;
            border: 1px dashed #d1d5db;
            padding: 40px;
            text-align: center;
            color: #6b7280;
            margin: 20px 0;
            border-radius: 8px;
        }
        @media print {
            body { margin: 20px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Market Insights Report</h1>
        <p class="subtitle">${metadata.city} Real Estate Market Analysis</p>
        <p class="subtitle">Generated on ${new Date(metadata.analysisDate).toLocaleDateString()}</p>
    </div>

    <div class="metadata">
        <div><strong>City:</strong> ${metadata.city}</div>
        <div><strong>Time Period:</strong> ${metadata.timePeriod}</div>
        <div><strong>Data Points:</strong> ${metadata.totalFilterRecords.toLocaleString()}</div>
        <div><strong>Confidence:</strong> ${Math.round(confidence * 100)}%</div>
        <div><strong>Analysis Type:</strong> ${metadata.fallbackUsed ? 'Statistical' : 'AI-Powered'}</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    </div>

    <div class="section">
        <h2 class="section-title">Key Metrics Overview</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${data.totalSearches.toLocaleString()}</div>
                <div class="metric-label">Total Searches</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.uniqueUsers.toLocaleString()}</div>
                <div class="metric-label">Unique Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.topProperty}</div>
                <div class="metric-label">Top Property Type</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.topLocation}</div>
                <div class="metric-label">Most Popular Area</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Property Type Demand</h2>
        <table>
            <thead>
                <tr>
                    <th>Property Type</th>
                    <th>Search Count</th>
                    <th>Market Share</th>
                </tr>
            </thead>
            <tbody>
                ${data.propertyTypeDemand.map(item => `
                    <tr>
                        <td>${item.property_type}</td>
                        <td>${item.search_count.toLocaleString()}</td>
                        <td>${item.percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Budget Distribution</h2>
        <table>
            <thead>
                <tr>
                    <th>Budget Range</th>
                    <th>Search Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.budgetDistribution).map(([range, count]) => `
                    <tr>
                        <td>${range}</td>
                        <td>${count.toLocaleString()}</td>
                        <td>${data.totalSearches > 0 ? Math.round((count / data.totalSearches) * 100) : 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Top Areas</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Area</th>
                    <th>Search Count</th>
                </tr>
            </thead>
            <tbody>
                ${data.popularAreas.slice(0, 10).map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.area}</td>
                        <td>${item.search_count.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Top Amenities</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Amenity</th>
                    <th>Search Count</th>
                </tr>
            </thead>
            <tbody>
                ${data.amenitiesRanking.slice(0, 10).map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.amenity}</td>
                        <td>${item.usage_count.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">${metadata.fallbackUsed ? 'Statistical Analysis' : 'AI Market Intelligence'}</h2>
        <div class="insights">
            <pre style="white-space: pre-wrap; font-family: inherit;">${aiInsights}</pre>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Actionable Recommendations</h2>
        ${actionableRecommendations.map((rec, index) => `
            <div class="recommendation">
                <strong>${index + 1}.</strong> ${rec}
            </div>
        `).join('')}
    </div>

    <div class="section" style="margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>This report was generated by the RoomVia Market Insights Dashboard</p>
        <p>For questions or support, contact your system administrator</p>
    </div>
</body>
</html>
  `.trim()
}

// Utility function to download JSON data for API integration
export function exportToJSON(marketData: MarketInsightsResponse): void {
  try {
    const jsonContent = JSON.stringify(marketData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `market-insights-${marketData.metadata.city}-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Error exporting JSON:', error)
    throw new Error('Failed to export JSON')
  }
}