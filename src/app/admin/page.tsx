'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Radar, Activity, ArrowUpRight, ShieldCheck, Languages, Bell, ScanLine, ShoppingCart, ChefHat } from 'lucide-react';

type SectionStatus = 'good' | 'warn' | 'alert';

type DonutSegment = {
	label: string;
	value: number;
	color: string;
};

type RadarMetric = {
	label: string;
	value: number;
};

type HeatCell = {
	day: string;
	hour: string;
	value: number;
};

const adminCodeValue = process.env.NEXT_PUBLIC_SURVEY_ADMIN_CODE || 'nosh_admin_2025';

const weeklyResponses = [18, 24, 21, 29, 35, 42, 39, 48, 56, 61, 58, 66];
const featureDemand = [92, 81, 69, 55, 47, 36];
const painPoints = [78, 65, 59, 46, 39];
const channelMix = [
	{ label: 'App', values: [14, 18, 22, 26] },
	{ label: 'Voice', values: [7, 10, 14, 18] },
	{ label: 'Web', values: [9, 11, 13, 15] },
];
const supportDonut: DonutSegment[] = [
	{ label: 'Pantry', value: 30, color: '#ef4444' },
	{ label: 'Recipes', value: 24, color: '#f59e0b' },
	{ label: 'Scanner', value: 18, color: '#3b82f6' },
	{ label: 'Voice', value: 16, color: '#10b981' },
	{ label: 'Profile', value: 12, color: '#8b5cf6' },
];
const languageDonut: DonutSegment[] = [
	{ label: 'English', value: 52, color: '#0ea5e9' },
	{ label: 'Spanish', value: 21, color: '#22c55e' },
	{ label: 'Hindi', value: 14, color: '#f97316' },
	{ label: 'Other', value: 13, color: '#64748b' },
];
const radarMetrics: RadarMetric[] = [
	{ label: 'Speed', value: 0.84 },
	{ label: 'Trust', value: 0.88 },
	{ label: 'Clarity', value: 0.71 },
	{ label: 'Accessibility', value: 0.74 },
	{ label: 'Delight', value: 0.59 },
	{ label: 'Retention', value: 0.67 },
];
const scatterPoints = [
	{ x: 0.12, y: 0.76 },
	{ x: 0.17, y: 0.71 },
	{ x: 0.24, y: 0.63 },
	{ x: 0.31, y: 0.59 },
	{ x: 0.38, y: 0.51 },
	{ x: 0.45, y: 0.47 },
	{ x: 0.54, y: 0.39 },
	{ x: 0.61, y: 0.34 },
	{ x: 0.69, y: 0.29 },
	{ x: 0.77, y: 0.24 },
	{ x: 0.84, y: 0.19 },
	{ x: 0.91, y: 0.15 },
];
const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const heatmapHours = ['Morning', 'Afternoon', 'Evening', 'Night'];
const heatmapCells: HeatCell[] = heatmapDays.flatMap((day, dayIndex) =>
	heatmapHours.map((hour, hourIndex) => ({
		day,
		hour,
		value: [18, 24, 33, 21, 26, 29, 23, 31, 41, 28, 34, 38, 24, 35, 48, 32, 39, 44, 27, 40, 55, 36, 42, 47, 25, 38, 50, 34][dayIndex * 4 + hourIndex],
	})),
);

function getStatusColor(status: SectionStatus) {
	if (status === 'good') return 'from-emerald-500 to-emerald-600';
	if (status === 'warn') return 'from-amber-500 to-orange-500';
	return 'from-rose-500 to-red-600';
}

function toPolarPath(values: number[], radius: number, centerX: number, centerY: number) {
	const count = values.length;
	return values
		.map((value, index) => {
			const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
			const distance = radius * value;
			const x = centerX + Math.cos(angle) * distance;
			const y = centerY + Math.sin(angle) * distance;
			return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
		})
		.join(' ') + ' Z';
}

export default function AdminPage() {
	const [authorized, setAuthorized] = useState(true);
	const [code, setCode] = useState('');
	const [error, setError] = useState('');

	const authPrompt = !authorized;

	const totals = useMemo(() => ({
		responses: 1245,
		households: 4.1,
		expiryAwareness: 82,
		cookingStress: 63,
		duplicateBuying: 29,
	}), []);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (code === adminCodeValue) {
			setAuthorized(true);
			setError('');
			return;
		}
		setError('Invalid admin code');
	};

	if (authPrompt) {
		return (
			<div className="min-h-screen bg-[#eef4fb] flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					className="w-full max-w-md rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white shadow-2xl p-8"
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<h1 className="text-2xl font-extrabold text-slate-900">Admin Access</h1>
							<p className="text-sm text-slate-500">Open the analytics board</p>
						</div>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<input
							type="password"
							value={code}
							onChange={(event) => setCode(event.target.value)}
							placeholder="Enter admin code"
							className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
						/>
						{error ? <p className="text-sm text-rose-600">{error}</p> : null}
						<button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800">
							Access Dashboard
						</button>
					</form>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#eef4fb] text-slate-900 relative overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.15),_transparent_30%)]" />
			<main className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
					<div>
						<p className="text-sm font-semibold tracking-[0.28em] text-sky-700 uppercase">Admin Analytics</p>
						<h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tight">NoshNurture Control Board</h1>
						<p className="mt-3 max-w-3xl text-slate-600">
							This page is built as a true admin dashboard. Each chart below answers a different product question: usage growth, feature demand, pain points, channel mix, language split, satisfaction, and more.
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<button className="rounded-2xl bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600">
							Export PDF
						</button>
						<button
							onClick={() => setAuthorized(false)}
							className="rounded-2xl bg-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600"
						>
							Logout
						</button>
					</div>
				</div>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
					<MetricCard icon={<Activity className="h-5 w-5" />} label="Total Responses" value="1,245" accent="from-sky-500 to-blue-600" />
					<MetricCard icon={<ChefHat className="h-5 w-5" />} label="Avg Household" value={`${totals.households.toFixed(1)} people`} accent="from-emerald-500 to-green-600" />
					<MetricCard icon={<Bell className="h-5 w-5" />} label="Expiry Awareness" value={`${totals.expiryAwareness}%`} accent="from-amber-500 to-orange-600" />
					<MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Duplicate Buying" value={`${totals.duplicateBuying}%`} accent="from-fuchsia-500 to-violet-600" />
				</section>

				<section className="grid gap-6 xl:grid-cols-2 mb-6">
					<ChartCard title="1. Weekly response trend" icon={<ArrowUpRight className="h-5 w-5" />} subtitle="Line chart for response volume across 12 weeks.">
						<LineChart values={weeklyResponses} />
					</ChartCard>
					<ChartCard title="2. Feature demand split" icon={<BarChart3 className="h-5 w-5" />} subtitle="Vertical bars for the most requested product features.">
						<VerticalBars values={featureDemand} labels={['Expiry', 'Scanner', 'Voice', 'Lists', 'Recipes', 'Language']} color="#0ea5e9" />
					</ChartCard>
					<ChartCard title="3. Top pain points" icon={<BarChart3 className="h-5 w-5 rotate-90" />} subtitle="Horizontal bars for the issues users report most often.">
						<HorizontalBars values={painPoints} labels={['Expired items', 'Duplicate buys', 'Search friction', 'Too many taps', 'Language friction']} color="#f59e0b" />
					</ChartCard>
					<ChartCard title="4. Response channel mix" icon={<BarChart3 className="h-5 w-5" />} subtitle="Stacked bars comparing app, voice, and web usage.">
						<StackedBars groups={channelMix} colors={['#14b8a6', '#8b5cf6', '#ec4899']} />
					</ChartCard>
					<ChartCard title="5. Issue category share" icon={<PieChart className="h-5 w-5" />} subtitle="Pie chart showing the distribution of admin support topics.">
						<DonutChart segments={supportDonut} innerLabel="Support" />
					</ChartCard>
					<ChartCard title="6. Language adoption" icon={<Languages className="h-5 w-5" />} subtitle="Donut chart showing language mix across users.">
						<DonutChart segments={languageDonut} innerLabel="Languages" holeRatio={0.58} />
					</ChartCard>
					<ChartCard title="7. Satisfaction radar" icon={<Radar className="h-5 w-5" />} subtitle="Radar chart highlighting the strongest and weakest dimensions.">
						<RadarChart metrics={radarMetrics} />
					</ChartCard>
					<ChartCard title="8. Engagement curve" icon={<Activity className="h-5 w-5" />} subtitle="Area chart for cumulative sessions over time.">
						<AreaChart values={[20, 28, 35, 41, 52, 63, 74]} />
					</ChartCard>
					<ChartCard title="9. Effort vs stress" icon={<ArrowUpRight className="h-5 w-5" />} subtitle="Scatter plot for the link between prep effort and stress.">
						<ScatterChart points={scatterPoints} />
					</ChartCard>
					<ChartCard title="10. Activity heatmap" icon={<ScanLine className="h-5 w-5" />} subtitle="Heatmap for the busiest day/time windows.">
						<HeatmapChart days={heatmapDays} hours={heatmapHours} cells={heatmapCells} />
					</ChartCard>
				</section>

				<section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
					<CardPanel title="Feature preferences" subtitle="Which product areas deserve the most attention right now?" status="good">
						<div className="space-y-4">
							{[
								['Expiry Alerts', 92],
								['Shopping List', 78],
								['Voice Assistant', 65],
								['Multilingual', 42],
							].map(([label, value]) => (
								<div key={label}>
									<div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
										<span>{label}</span>
										<span>{value}%</span>
									</div>
									<div className="h-3 rounded-full bg-slate-200 overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${value}%` }}
											transition={{ duration: 1, ease: 'easeOut' }}
											className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
										/>
									</div>
								</div>
							))}
						</div>
					</CardPanel>

					<div className="grid gap-6 sm:grid-cols-2">
						<CardPanel title="Operational snapshot" subtitle="Quick health metrics for the team." status="warn">
							<div className="space-y-3 text-sm text-slate-600">
								<MetricRow label="Scanner uptime" value="99.2%" />
								<MetricRow label="Average response time" value="1.8s" />
								<MetricRow label="Notification success" value="96%" />
								<MetricRow label="Unread alerts" value="14" />
							</div>
						</CardPanel>

						<CardPanel title="Risk summary" subtitle="What needs attention first?" status="alert">
							<div className="space-y-3 text-sm text-slate-600">
								<MetricRow label="Duplicate purchase risk" value="High" />
								<MetricRow label="Expiry misses" value="Medium" />
								<MetricRow label="Language friction" value="Low" />
								<MetricRow label="Voice usage" value="Rising" />
							</div>
						</CardPanel>
					</div>
				</section>
			</main>
		</div>
	);
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={`rounded-[1.75rem] bg-gradient-to-br ${accent} p-5 text-white shadow-xl shadow-slate-200/60`}
		>
			<div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
				{icon}
			</div>
			<p className="text-sm font-medium text-white/80">{label}</p>
			<p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
		</motion.div>
	);
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] p-6"
		>
			<div className="mb-4 flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg md:text-xl font-extrabold text-slate-900 flex items-center gap-2">{icon}{title}</h2>
					<p className="mt-1 text-sm text-slate-500">{subtitle}</p>
				</div>
			</div>
			<div className="min-h-[320px] h-full flex flex-col">{children}</div>
		</motion.div>
	);
}

function CardPanel({ title, subtitle, status, children }: { title: string; subtitle: string; status: SectionStatus; children: React.ReactNode }) {
	return (
		<div className="rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] p-5">
			<div className={`mb-5 inline-flex rounded-full bg-gradient-to-r ${getStatusColor(status)} px-3 py-1 text-xs font-bold text-white`}>
				{status.toUpperCase()}
			</div>
			<h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
			<p className="mt-1 mb-4 text-sm text-slate-500">{subtitle}</p>
			{children}
		</div>
	);
}

function MetricRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
			<span className="font-semibold text-slate-700">{label}</span>
			<span className="font-black text-slate-900">{value}</span>
		</div>
	);
}

function LineChart({ values }: { values: number[] }) {
	const width = 100;
	const height = 100;
	const max = Math.max(...values);
	const points = values.map((value, index) => {
		const x = (index / (values.length - 1)) * width;
		const y = height - (value / max) * 80 - 10;
		return { x, y };
	});
	const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
	const area = `${path} L 100 100 L 0 100 Z`;

	return (
		<svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
			{[20, 40, 60, 80].map((line) => (
				<line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#e2e8f0" strokeWidth="1" />
			))}
			<path d={area} fill="url(#lineArea)" opacity="0.2" />
			<path d={path} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
			{points.map((point, index) => (
				<circle key={index} cx={point.x} cy={point.y} r="2.8" fill="#0f766e" stroke="white" strokeWidth="1.4" />
			))}
			<defs>
				<linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stopColor="#14b8a6" />
					<stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
}

function VerticalBars({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
	const max = Math.max(...values);
	return (
		<div className="flex h-full items-end gap-3 pb-2">
			{values.map((value, index) => (
				<div key={labels[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
					<div className="flex h-full w-full items-end rounded-2xl bg-slate-100 p-2">
						<motion.div
							initial={{ height: 0 }}
							animate={{ height: `${(value / max) * 100}%` }}
							transition={{ duration: 1, delay: index * 0.08 }}
							className="w-full rounded-xl"
							style={{ backgroundColor: color }}
						/>
					</div>
					<div className="text-center text-xs font-semibold text-slate-600">{labels[index]}</div>
					<div className="text-xs font-bold text-slate-900">{value}%</div>
				</div>
			))}
		</div>
	);
}

function HorizontalBars({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
	const max = Math.max(...values);
	return (
		<div className="space-y-4">
			{values.map((value, index) => (
				<div key={labels[index]}>
					<div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
						<span>{labels[index]}</span>
						<span>{value}%</span>
					</div>
					<div className="h-3 rounded-full bg-slate-200 overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${(value / max) * 100}%` }}
							transition={{ duration: 1, delay: index * 0.08 }}
							className="h-full rounded-full"
							style={{ backgroundColor: color }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

function StackedBars({ groups, colors }: { groups: { label: string; values: number[] }[]; colors: string[] }) {
	const max = Math.max(...groups.map((group) => group.values.reduce((sum, value) => sum + value, 0)));
	return (
		<div className="h-full flex items-end gap-4">
			{groups.map((group, groupIndex) => {
				const total = group.values.reduce((sum, value) => sum + value, 0);
				let current = 0;
				return (
					<div key={group.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
						<div className="flex h-full w-full items-end rounded-2xl bg-slate-100 p-2">
							<div className="flex w-full flex-col-reverse justify-start overflow-hidden rounded-xl">
								{group.values.map((value, index) => {
									const height = `${(value / max) * 100}%`;
									const segment = (
										<motion.div
											key={index}
											initial={{ height: 0 }}
											animate={{ height }}
											transition={{ duration: 1, delay: groupIndex * 0.1 + index * 0.08 }}
											className="w-full"
											style={{ backgroundColor: colors[index] }}
										/>
									);
									current += value;
									return segment;
								})}
							</div>
						</div>
						<div className="text-center text-xs font-semibold text-slate-600">{group.label}</div>
						<div className="text-xs font-bold text-slate-900">{total}</div>
					</div>
				);
			})}
		</div>
	);
}

function DonutChart({ segments, innerLabel, holeRatio = 0.7 }: { segments: DonutSegment[]; innerLabel: string; holeRatio?: number }) {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	const gap = 2; // Degrees of gap between segments
	let currentAngle = 0;

	const describeArc = (startAngle: number, endAngle: number) => {
		const radius = 40;
		const center = 50;
		// Subtract small gap from end to avoid overlap
		const adjustedEnd = endAngle - (segments.length > 1 ? gap : 0);
		if (adjustedEnd <= startAngle) return '';

		const start = polarToCartesian(center, center, radius, adjustedEnd);
		const end = polarToCartesian(center, center, radius, startAngle);
		const largeArcFlag = adjustedEnd - startAngle <= 180 ? '0' : '1';
		return [`M ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`].join(' ');
	};

	return (
		<div className="flex h-full flex-col items-center justify-between gap-6">
			<div className="relative h-[180px] w-[180px] shrink-0">
				<svg viewBox="0 0 100 100" className="h-full w-full">
					{segments.map((segment) => {
						const angle = (segment.value / total) * 360;
						const path = describeArc(currentAngle, currentAngle + angle);
						const startAngle = currentAngle;
						currentAngle += angle;
						if (!path) return null;
						return (
							<motion.path
								key={segment.label}
								initial={{ pathLength: 0, opacity: 0 }}
								animate={{ pathLength: 1, opacity: 1 }}
								transition={{ duration: 1, ease: 'easeOut' }}
								d={path}
								fill="none"
								stroke={segment.color}
								strokeWidth={14}
								strokeLinecap="round"
							/>
						);
					})}
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center">
						<div className="text-3xl font-black text-slate-900">{total}{total === 100 ? '%' : ''}</div>
						<div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{innerLabel}</div>
					</div>
				</div>
			</div>
			<div className={`grid w-full gap-2 ${segments.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
				{segments.map((segment) => (
					<div key={segment.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs">
						<div className="flex items-center gap-2 font-semibold text-slate-700 truncate">
							<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
							<span className="truncate">{segment.label}</span>
						</div>
						<div className="font-bold text-slate-900 shrink-0">{Math.round((segment.value / total) * 100)}%</div>
					</div>
				))}
			</div>
		</div>
	);
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}

function RadarChart({ metrics }: { metrics: RadarMetric[] }) {
	const values = metrics.map((metric) => metric.value);
	const labels = metrics.map((metric) => metric.label);
	const points = useMemo(() => {
		const count = values.length;
		const radius = 36;
		const center = 50;
		return values.map((value, index) => {
			const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
			return {
				x: center + Math.cos(angle) * radius * value,
				y: center + Math.sin(angle) * radius * value,
			};
		});
	}, [values]);

	return (
		<svg viewBox="0 0 100 100" className="h-full w-full">
			{[0.25, 0.5, 0.75, 1].map((ring) => {
				const path = toRadarRing(labels.length, ring * 36);
				return <path key={ring} d={path} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
			})}
			{labels.map((label, index) => {
				const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
				const endX = 50 + Math.cos(angle) * 36;
				const endY = 50 + Math.sin(angle) * 36;
				const textX = 50 + Math.cos(angle) * 44;
				const textY = 50 + Math.sin(angle) * 44;
				return (
					<g key={label}>
						<line x1="50" y1="50" x2={endX} y2={endY} stroke="#e2e8f0" strokeWidth="1" />
						<text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle" fill="#475569" fontSize="4" fontWeight="700">
							{label}
						</text>
					</g>
				);
			})}
			<polygon
				points={points.map((point) => `${point.x},${point.y}`).join(' ')}
				fill="rgba(124,58,237,0.20)"
				stroke="#7c3aed"
				strokeWidth="2"
			/>
			{points.map((point, index) => (
				<circle key={index} cx={point.x} cy={point.y} r="1.8" fill="#7c3aed" stroke="white" strokeWidth="1" />
			))}
		</svg>
	);
}

function toRadarRing(count: number, radius: number) {
	const center = 50;
	const points: string[] = [];
	for (let index = 0; index < count; index += 1) {
		const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
		const x = center + Math.cos(angle) * radius;
		const y = center + Math.sin(angle) * radius;
		points.push(`${index === 0 ? 'M' : 'L'} ${x} ${y}`);
	}
	return `${points.join(' ')} Z`;
}

function AreaChart({ values }: { values: number[] }) {
	const width = 100;
	const height = 100;
	const max = Math.max(...values);
	const points = values.map((value, index) => {
		const x = (index / (values.length - 1)) * width;
		const y = height - (value / max) * 74 - 12;
		return { x, y };
	});
	const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
	const area = `${path} L 100 100 L 0 100 Z`;

	return (
		<svg viewBox="0 0 100 100" className="h-full w-full">
			{[20, 40, 60, 80].map((line) => (
				<line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#e2e8f0" strokeWidth="1" />
			))}
			<path d={area} fill="#ea580c" opacity="0.18" />
			<path d={path} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
			{points.map((point, index) => (
				<circle key={index} cx={point.x} cy={point.y} r="2.5" fill="#ea580c" stroke="white" strokeWidth="1.4" />
			))}
		</svg>
	);
}

function ScatterChart({ points }: { points: { x: number; y: number }[] }) {
	return (
		<svg viewBox="0 0 100 100" className="h-full w-full">
			{[20, 40, 60, 80].map((line) => (
				<line key={line} x1="10" y1={line} x2="92" y2={line} stroke="#e2e8f0" strokeWidth="1" />
			))}
			{[20, 40, 60, 80].map((line) => (
				<line key={`v-${line}`} y1="10" x1={line} y2="90" x2={line} stroke="#e2e8f0" strokeWidth="1" />
			))}
			<line x1="10" y1="90" x2="92" y2="90" stroke="#cbd5e1" strokeWidth="1.2" />
			<line x1="10" y1="10" x2="10" y2="90" stroke="#cbd5e1" strokeWidth="1.2" />
			{points.map((point, index) => (
				<circle key={index} cx={10 + point.x * 82} cy={10 + point.y * 80} r="2.8" fill="#0f766e" opacity="0.92" />
			))}
		</svg>
	);
}

function HeatmapChart({ days, hours, cells }: { days: string[]; hours: string[]; cells: HeatCell[] }) {
	const max = Math.max(...cells.map((cell) => cell.value));
	const gridTemplateColumns = `90px repeat(${days.length}, minmax(0, 1fr))`;
	return (
		<div className="h-full overflow-x-auto pb-1">
			<div className="min-w-[680px]">
				<div className="grid gap-2 text-xs font-semibold text-slate-500 mb-3" style={{ gridTemplateColumns }}>
					<div />
					{days.map((day) => (
						<div key={day} className="text-center">{day}</div>
					))}
				</div>
				<div className="grid gap-2">
					{hours.map((hour) => (
						<div key={hour} className="grid gap-2 items-stretch" style={{ gridTemplateColumns }}>
							<div className="flex items-center text-xs font-semibold text-slate-500">{hour}</div>
							{days.map((day) => {
								const cell = cells.find((entry) => entry.day === day && entry.hour === hour);
								const intensity = cell ? cell.value / max : 0;
								const bg = `rgba(34, 197, 94, ${0.12 + intensity * 0.8})`;
								return (
									<div
										key={`${day}-${hour}`}
										className="rounded-2xl px-2 py-4 text-center text-xs font-bold text-white"
										style={{ background: bg }}
									>
										{cell?.value ?? 0}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}