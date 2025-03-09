import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfigResponse, FilingsResponse, FundFiling } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';

export default function Home() {
  const [funds, setFunds] = useState<Record<string, string>>({});
  const [selectedFund, setSelectedFund] = useState('');
  const [filings, setFilings] = useState<FundFiling[]>([]);
  const [stats, setStats] = useState({
    aum: 0,
    quarter: '',
    qoq_change: '0',
    yoy_growth: 'N/A',
    total_appreciation: '0',
    volatility: '0',
    max_growth: '0',
    max_decline: '0',
    growth_consistency: '0',
  });

  const [quarterlyChanges, setQuarterlyChanges] = useState([]);

  const [view, setView] = useState<'performance' | 'history'>('performance');

  // Fetch funds config
  useEffect(() => {
    fetch('http://localhost:3000/api/config')
      .then((res) => res.json())
      .then((data: ConfigResponse) => {
        const fundMap = data.funds.reduce((acc: Record<string, string>, f) => {
          acc[f.name] = f.cik;
          return acc;
        }, {});
        setFunds(fundMap);
        if (data.funds.length > 0) setSelectedFund(data.funds[0].name);
      })
      .catch((err) => console.error('Error fetching config:', err));
  }, []);

  useEffect(() => {
    if (!selectedFund || !funds[selectedFund]) return;

    const cik = funds[selectedFund];
    Promise.all([
      fetch(`http://localhost:3000/api/funds/${cik}/filings`)
        .then((res) => res.json())
        .then((data: FilingsResponse) =>
          setFilings(
            data.filings.map((f) => ({
              quarter: f.quarter,
              value_usd: Number(f.value_usd),
            })),
          ),
        ),
      fetch(`http://localhost:3000/api/funds/${cik}/stats`)
        .then((res) => res.json())
        .then((data) => setStats(data.stats)),
      fetch(`http://localhost:3000/api/funds/${cik}/volatility`)
        .then((res) => res.json())
        .then((data) => setQuarterlyChanges(data.volatility)),
    ]).catch((err) => console.error('Error fetching data:', err));
  }, [selectedFund, funds]);

  const handleExportCSV = () => {
    if (filings.length === 0) return;

    // Create CSV content with for loops
    let csvContent = 'Fund,Quarter,AUM,Change (QoQ)\n';

    for (let i = 0; i < filings.length; i++) {
      const f = filings[i];
      let qoqChange = 'N/A';

      if (i > 0) {
        const prevFiling = filings[i - 1];
        qoqChange = ((f.value_usd / prevFiling.value_usd - 1) * 100).toFixed(2);
      }

      csvContent += `${selectedFund},${f.quarter},${f.value_usd},${qoqChange}\n`;
    }

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedFund.replace(/\s+/g, '_')}_filings.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 pt-6 pb-3 px-6 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-black text-xs font-bold">13F</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">INSIGHTS</h1>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                INSTITUTIONAL PORTFOLIO ANALYTICS
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={selectedFund} onValueChange={setSelectedFund}>
                <SelectTrigger className="w-[240px] bg-zinc-900 border-zinc-900 text-white focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select fund" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {Object.keys(funds).map((fund) => (
                    <SelectItem
                      key={fund}
                      value={fund}
                      className="hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white text-zinc-300"
                    >
                      {fund}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="hidden md:flex space-x-3">
                <Button
                  variant={view === 'performance' ? 'default' : 'outline'}
                  onClick={() => setView('performance')}
                  className={
                    view === 'performance'
                      ? 'bg-white text-black hover:bg-zinc-200 hover:text-black'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
                  }
                >
                  Performance
                </Button>
                <Button
                  variant={view === 'history' ? 'default' : 'outline'}
                  onClick={() => setView('history')}
                  className={
                    view === 'history'
                      ? 'bg-white text-black hover:bg-zinc-200 hover:text-black'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
                  }
                >
                  History
                </Button>
              </div>
            </div>
          </div>

          {filings.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-6 pb-2">
              <div className="flex items-center">
                <DollarSign size={14} className="text-zinc-500 mr-1" />
                <span className="text-xs text-zinc-500 mr-2">AUM</span>
                <span className="text-lg font-bold">
                  ${(Number(stats.aum) / 1000000000).toFixed(2)}B
                </span>
                <div
                  className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium flex items-center ${parseFloat(stats.qoq_change) >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}
                >
                  {parseFloat(stats.qoq_change) >= 0 ? (
                    <ChevronUp size={12} className="mr-0.5" />
                  ) : (
                    <ChevronDown size={12} className="mr-0.5" />
                  )}
                  {parseFloat(stats.qoq_change) >= 0 ? '+' : ''}
                  {stats.qoq_change}%
                </div>
              </div>
              <div className="flex items-center">
                <TrendingUp size={14} className="text-zinc-500 mr-1" />
                <span className="text-xs text-zinc-500 mr-2">VOLATILITY</span>
                <span className="text-lg font-bold">{stats.volatility}%</span>
              </div>
              <div className="flex items-center">
                <ArrowUpRight size={14} className="text-zinc-500 mr-1" />
                <span className="text-xs text-zinc-500 mr-2">YOY</span>
                <span className="text-lg font-bold">
                  {stats.yoy_growth !== 'N/A'
                    ? `${parseFloat(stats.yoy_growth) >= 0 ? '+' : ''}${stats.yoy_growth}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-zinc-500 mr-2">LATEST</span>
                <span className="text-lg font-bold">{stats.quarter}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {filings.length > 0 ? (
          <>
            {view === 'performance' ? (
              <>
                {/* Main Chart */}
                <div className="mb-10">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-1">
                      Assets Under Management
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Historical 13F filing data for {selectedFund}
                    </p>
                  </div>
                  <div className="bg-black border border-zinc-900 rounded-lg p-6 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={filings}
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorAssets"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#22c55e"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#22c55e"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="quarter"
                          stroke="#52525b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#27272a' }}
                          padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                          stroke="#52525b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#27272a' }}
                          tickFormatter={(value) =>
                            `${(value / 1000).toLocaleString()}k`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '4px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [
                            `${value.toLocaleString()}`,
                            'AUM',
                          ]}
                          labelFormatter={(label) => `Quarter: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="value_usd"
                          name={selectedFund}
                          stroke="#22c55e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAssets)"
                          activeDot={{
                            r: 6,
                            fill: '#22c55e',
                            stroke: '#fff',
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quarterly Change Chart */}
                <div className="mb-10">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-1">
                      Quarterly Performance
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Quarter-over-quarter percentage changes
                    </p>
                  </div>
                  <div className="bg-black border border-zinc-900 rounded-lg p-6 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={quarterlyChanges}
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="quarter"
                          stroke="#52525b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#27272a' }}
                        />
                        <YAxis
                          stroke="#52525b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#27272a' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <ReferenceLine y={0} stroke="#27272a" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '4px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(value: string) => [`${value}%`, 'Change']}
                          labelFormatter={(label) => `Quarter: ${label}`}
                        />
                        <defs>
                          <linearGradient
                            id="colorChange"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Change"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorChange)"
                          activeDot={{
                            r: 6,
                            fill: '#ef4444',
                            stroke: '#fff',
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <Card className="bg-black border-zinc-900 shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardDescription className="text-xs text-zinc-500 uppercase font-medium">
                        MAXIMUM GROWTH
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-white">
                        {stats.max_growth}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <p className="text-xs text-zinc-500">
                        Highest quarter-over-quarter growth
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black border-zinc-900 shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardDescription className="text-xs text-zinc-500 uppercase font-medium">
                        MAXIMUM DECLINE
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-white">
                        {stats.max_decline}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <p className="text-xs text-zinc-500">
                        Largest quarter-over-quarter decline
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black border-zinc-900 shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardDescription className="text-xs text-zinc-500 uppercase font-medium">
                        GROWTH CONSISTENCY
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-white">
                        {stats.growth_consistency}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <p className="text-xs text-zinc-500">
                        Percentage of quarters with positive growth
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black border-zinc-900 shadow-none">
                    <CardHeader className="p-6 pb-3">
                      <CardDescription className="text-xs text-zinc-500 uppercase font-medium">
                        TOTAL APPRECIATION
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-white">
                        {stats.total_appreciation}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <p className="text-xs text-zinc-500">
                        Growth from first reported filing
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <>
                {/* Filing History Table */}
                <div className="mb-10">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Filing History</h2>
                      <p className="text-zinc-500 text-sm">
                        Complete record of {selectedFund} 13F filings
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-transparent border-zinc-900 text-white hover:bg-zinc-900 hover:text-white hover:border-zinc-800"
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </Button>
                  </div>
                  <div className="bg-black border border-zinc-900 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-900">
                          <TableHead className="text-zinc-400 text-xs uppercase font-medium p-4 w-1/4">
                            FUND
                          </TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase font-medium p-4 w-1/4">
                            QUARTER
                          </TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase font-medium p-4 text-right w-1/4">
                            AUM
                          </TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase font-medium p-4 text-right w-1/4">
                            CHANGE (QoQ)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filings.map((f, idx) => {
                          const prevFiling = idx > 0 ? filings[idx - 1] : null;
                          const qoqChange = prevFiling
                            ? (
                                (f.value_usd / prevFiling.value_usd - 1) *
                                100
                              ).toFixed(2)
                            : null;
                          return (
                            <TableRow
                              key={f.quarter}
                              className="hover:bg-zinc-800/50 border-zinc-900"
                            >
                              <TableCell className="p-4 text-sm font-medium">
                                {selectedFund}
                              </TableCell>
                              <TableCell className="p-4 text-sm text-zinc-300">
                                {f.quarter}
                              </TableCell>
                              <TableCell className="p-4 text-sm text-right font-mono">
                                ${f.value_usd.toLocaleString()}
                              </TableCell>
                              <TableCell className="p-4 text-sm text-right font-medium">
                                {qoqChange ? (
                                  <span
                                    className={`px-2 py-1 rounded ${parseFloat(qoqChange) >= 0 ? 'bg-emerald-950/70 text-emerald-400' : 'bg-red-950/70 text-red-400'}`}
                                  >
                                    {parseFloat(qoqChange) >= 0 ? '+' : ''}
                                    {qoqChange}%
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : selectedFund ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Loading Data...</h3>
            <p className="text-zinc-500">
              Retrieving 13F filing information for {selectedFund}
            </p>
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Select a Fund</h3>
            <p className="text-zinc-500">
              Choose an institutional investment fund to view their 13F filing
              history and performance metrics
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 py-6 mt-10 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <p>13F INSIGHTS • INSTITUTIONAL PORTFOLIO TRACKER</p>
            <p>DATA UPDATED {stats.quarter || 'N/A'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
