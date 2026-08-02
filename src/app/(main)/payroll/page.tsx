'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, Download, FileClock, RefreshCw, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react';
import styles from './payroll-page.module.css';
import pageStyles from '../main-pages.module.css';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_COLORS, ACTION_BUTTON_SIZES } from '@/constants/actionButtons';
import { useGeneratePayroll, usePayrollList } from '@/services/payroll/usePayroll';
import type { PayrollFilters, PayrollListMeta, PayrollListResponse, PayrollRecord } from '@/types';
import { formatPkr } from '@/lib/formatCurrency';
import LoadingIndicator from '@/components/LoadingIndicator';

const DEFAULT_LIMIT = 10;

function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function formatCurrency(value: number) {
  return formatPkr(value || 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonthLabel(month: string) {
  if (!month) return '-';
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  return parsed.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function normalizePayrollPayload(payload: PayrollListResponse | PayrollRecord[] | undefined) {
  if (!payload) return { records: [] as PayrollRecord[], meta: undefined as PayrollListMeta | undefined };

  if (Array.isArray(payload)) {
    return { records: payload, meta: undefined };
  }

  return {
    records: Array.isArray(payload.data) ? payload.data : [],
    meta: payload.meta,
  };
}

function toCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

function downloadPayrollCsv(records: PayrollRecord[], month: string) {
  const headers = ['Payroll ID', 'Employee', 'Month', 'Basic Salary', 'Overtime', 'Bonus', 'Deductions', 'Net Pay', 'Generated At'];
  const rows = records.map((record) => [
    record.payrollId,
    record.employeeName ?? '',
    record.month,
    record.basicSalary,
    record.overtime,
    record.bonus,
    record.deductions,
    record.netPay,
    record.generatedAt,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `payroll-report-${month}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function PayrollPage() {
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const queryFilters = useMemo<PayrollFilters>(
    () => ({
      month,
      page,
      limit,
    }),
    [month, page, limit],
  );

  const { data: payrollResponse, isLoading, error } = usePayrollList(queryFilters);
  const generatePayroll = useGeneratePayroll();

  const normalizedPayload = useMemo(
    () => normalizePayrollPayload(payrollResponse?.data),
    [payrollResponse],
  );

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return normalizedPayload.records;

    return normalizedPayload.records.filter((record) => {
      return [
        record.payrollId,
        record.userId,
        record.employeeName ?? '',
        record.month,
        record.generatedAt,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [normalizedPayload.records, searchQuery]);

  const summary = useMemo(() => {
    const gross = filteredRecords.reduce((sum, record) => sum + record.basicSalary + record.overtime + record.bonus, 0);
    const deductions = filteredRecords.reduce((sum, record) => sum + record.deductions, 0);
    const net = filteredRecords.reduce((sum, record) => sum + record.netPay, 0);
    const overtime = filteredRecords.reduce((sum, record) => sum + record.overtime, 0);
    const bonus = filteredRecords.reduce((sum, record) => sum + record.bonus, 0);

    return {
      gross,
      deductions,
      net,
      overtime,
      bonus,
      headcount: filteredRecords.length,
      averageNet: filteredRecords.length ? net / filteredRecords.length : 0,
      generatedAt: filteredRecords[0]?.generatedAt ?? null,
    };
  }, [filteredRecords]);

  const totalRecords = normalizedPayload.meta?.totalRecords ?? filteredRecords.length;
  const totalPages = normalizedPayload.meta?.totalPages ?? Math.max(1, Math.ceil(filteredRecords.length / limit));

  const visibleRecords = useMemo(() => {
    if (normalizedPayload.meta) {
      return filteredRecords;
    }

    const start = (page - 1) * limit;
    return filteredRecords.slice(start, start + limit);
  }, [filteredRecords, normalizedPayload.meta, page, limit]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [month]);

  const handleGeneratePayroll = async () => {
    setFeedback(null);

    try {
      const result = await generatePayroll.mutateAsync({ month });
      setFeedback(`Payroll generated for ${formatMonthLabel(result.data.month)}. ${result.data.entriesGenerated} employee entries are ready for HR review.`);
      setPage(1);
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to generate payroll.';
      setFeedback(message);
    }
  };

  const handleExportCsv = () => {
    downloadPayrollCsv(filteredRecords, month);
    setFeedback(`Downloaded ${filteredRecords.length} payroll rows for ${formatMonthLabel(month)}.`);
  };

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className={pageStyles.pageContainer}>
      <div className={styles.pageHero}>
        <section className={styles.heroCard}>
          <div className={styles.eyebrow}>
            <Sparkles size={14} />
            Payroll management
          </div>
          <h1 className={styles.heroTitle}>Automated salary runs with HR review built in.</h1>
          <p className={styles.heroText}>
            Generate payroll from the live compensation pipeline, review attendance-linked calculations, and hand off clean reports to finance without manual spreadsheet work.
          </p>

          <div className={styles.heroMeta}>
            <span className={styles.metaPill}><Banknote size={14} /> Gross, overtime, bonus, and deductions in one view</span>
            <span className={styles.metaPill}><ShieldCheck size={14} /> Ready for HR approval and audit trails</span>
          </div>

          <div className={styles.heroActions}>
            <ActionButton
              onClick={handleGeneratePayroll}
              label={generatePayroll.isPending ? 'Generating...' : 'Run payroll'}
              color={ACTION_BUTTON_COLORS.success}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              loading={generatePayroll.isPending}
              tooltip="Generate the selected month payroll run"
            />
            <ActionButton
              onClick={handleExportCsv}
              label="Export CSV"
              color={ACTION_BUTTON_COLORS.secondary}
              width={ACTION_BUTTON_SIZES.labelOnly.width}
              height={ACTION_BUTTON_SIZES.labelOnly.height}
              tooltip="Download the payroll ledger for accounting"
            />
          </div>
        </section>

        <aside className={styles.quickPanel}>
          <div className={styles.quickPanelHeader}>
            <div>
              <h2 className={styles.quickPanelTitle}>Current cycle</h2>
              <p className={styles.quickPanelNote}>Run the payroll for a month, then review or export it for finance.</p>
            </div>
            <CalendarDays size={20} color="var(--color-primary)" />
          </div>

          <div className={styles.monthField}>
            <label className={styles.fieldLabel} htmlFor="payroll-month">Payroll month</label>
            <input
              id="payroll-month"
              className={styles.fieldInput}
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
            <p className={styles.fieldHelp}>Payroll runs are generated month-by-month from the backend payroll module.</p>
          </div>

          <div className={`${styles.statusBanner} ${feedback && feedback.toLowerCase().includes('failed') ? styles.statusBannerError : ''}`.trim()}>
            <RefreshCw size={16} />
            <span>{feedback || 'Salary output is derived from attendance, overtime, bonuses, and deductions.'}</span>
          </div>
        </aside>
      </div>

      {/* <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Payroll entries</p>
          <p className={styles.metricValue}>{totalRecords}</p>
          <p className={styles.metricHint}>Records returned for {formatMonthLabel(month)}.</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Gross payout</p>
          <p className={styles.metricValue}>{formatCurrency(summary.gross)}</p>
          <p className={styles.metricHint}>Basic salary plus overtime and bonuses.</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Deductions</p>
          <p className={styles.metricValue}>{formatCurrency(summary.deductions)}</p>
          <p className={styles.metricHint}>Subtracted before net pay is finalized.</p>
        </article>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Average net pay</p>
          <p className={styles.metricValue}>{formatCurrency(summary.averageNet)}</p>
          <p className={styles.metricHint}>Useful for HR review and accounting checks.</p>
        </article>
      </div> */}

      <div className={styles.mainGrid}>
        <section className={styles.ledgerCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardHeaderTitle}>Payroll ledger</h2>
              <p className={styles.cardHeaderText}>
                Review the generated employee payroll records before pushing them to accounting.
              </p>
            </div>
            <div className={styles.paginationText}>
              {isLoading ? (
                <LoadingIndicator label="Loading payroll data…" variant="inline" />
              ) : (
                `Showing ${visibleRecords.length} of ${totalRecords} records`
              )}
            </div>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.filterBlock}>
              <label className={styles.fieldLabel} htmlFor="payroll-search">Search payroll</label>
              <input
                id="payroll-search"
                className={styles.fieldInput}
                type="search"
                placeholder="Search by employee, payroll ID, or month"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className={styles.filterBlock}>
              <label className={styles.fieldLabel}>Generation month</label>
              <div className={styles.fieldInput} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileClock size={16} />
                <span>{formatMonthLabel(month)}</span>
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Employee</th>
                  <th className={styles.tableHeadCell}>Month</th>
                  <th className={styles.tableHeadCell}>Basic salary</th>
                  <th className={styles.tableHeadCell}>Overtime</th>
                  <th className={styles.tableHeadCell}>Bonus</th>
                  <th className={styles.tableHeadCell}>Deductions</th>
                  <th className={styles.tableHeadCell}>Net pay</th>
                  <th className={styles.tableHeadCell}>Generated</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.payrollId} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.employeeCell}>
                          <span className={styles.employeeName}>{record.employeeName || 'Unknown employee'}</span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>{formatMonthLabel(record.month)}</td>
                      <td className={`${styles.tableCell} ${styles.currencyCell}`}>{formatCurrency(record.basicSalary)}</td>
                      <td className={`${styles.tableCell} ${styles.currencyCell}`}>{formatCurrency(record.overtime)}</td>
                      <td className={`${styles.tableCell} ${styles.currencyCell}`}>{formatCurrency(record.bonus)}</td>
                      <td className={`${styles.tableCell} ${styles.currencyCell}`}>{formatCurrency(record.deductions)}</td>
                      <td className={`${styles.tableCell} ${styles.currencyCell} ${styles.netCell}`}>{formatCurrency(record.netPay)}</td>
                      <td className={styles.tableCell}>{formatDateTime(record.generatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.tableCell} colSpan={8}>
                      <div className={styles.emptyState}>
                        <span className={styles.emptyStateStrong}>No payroll rows found</span>
                        <p className={styles.quickPanelNote}>
                          Generate payroll for the selected month or change the filter to review a different run.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <div className={styles.paginationText}>
              {normalizedPayload.meta
                ? `Page ${normalizedPayload.meta.page} of ${normalizedPayload.meta.totalPages}`
                : `Local view of ${filteredRecords.length} payroll rows`}
            </div>
            <div className={styles.paginationControls}>
              <button className={styles.paginationButton} onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={!canGoPrevious}>
                Previous
              </button>
              <button className={styles.paginationButton} onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={!canGoNext}>
                Next
              </button>
            </div>
          </div>
        </section>

        {/* <aside className={styles.sideStack}>
          <section className={styles.infoCard}>
            <h2 className={styles.infoCardTitle}>How the payroll is calculated</h2>
            <ul className={styles.infoList}>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><Users size={16} /> Attendance-linked base pay</div>
                <p className={styles.infoListText}>Attendance logs are used by the backend payroll workflow to determine the base salary cycle.</p>
              </li>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><Wallet size={16} /> Overtime and bonus adjustments</div>
                <p className={styles.infoListText}>Extra hours and approved bonuses flow into the payroll entry before the final net pay is saved.</p>
              </li>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><Banknote size={16} /> Deductions and net pay</div>
                <p className={styles.infoListText}>The final amount is calculated as basic salary plus overtime and bonus, minus deductions.</p>
              </li>
            </ul>
            <div className={styles.formulaBox}>
              <p className={styles.formulaLabel}>Calculation formula</p>
              <p className={styles.formulaText}>netPay = basicSalary + overtime + bonus - deductions</p>
            </div>
          </section>

          <section className={styles.infoCard}>
            <h2 className={styles.infoCardTitle}>HR and finance handoff</h2>
            <ul className={styles.infoList}>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><Download size={16} /> Export-ready report</div>
                <p className={styles.infoListText}>Use the CSV export to send the monthly payroll ledger to accounting or external payroll systems.</p>
              </li>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><ShieldCheck size={16} /> HR review first</div>
                <p className={styles.infoListText}>The payroll run stays reviewable in the UI before it becomes part of the finance handoff.</p>
              </li>
              <li className={styles.infoListItem}>
                <div className={styles.infoListLabel}><RefreshCw size={16} /> Re-run anytime</div>
                <p className={styles.infoListText}>Generate the same month again after attendance or bonus values change, then export the refreshed report.</p>
              </li>
            </ul>
          </section>
        </aside> */}
      </div>

      {error ? <div className={styles.emptyState} style={{ marginTop: '16px' }}>{String(error)}</div> : null}
    </div>
  );
}