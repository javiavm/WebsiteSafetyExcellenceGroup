/**
 * Excel Export Utility for SEG Admin Dashboard
 */

const XLSX = require('xlsx');

function exportClientsToExcel(clients) {
    const data = clients.map(c => ({
        'ID': c.id,
        'Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
        'Company': c.company_name || '',
        'Contact': c.full_name || '',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Industry': c.industry || '',
        'Support Type': c.support_type || '',
        'Timeline': c.timeline || '',
        'Score': c.lead_score || '',
        'Classification': c.lead_classification || '',
        'Status': c.status || 'new'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 20 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function exportCandidatesToExcel(candidates) {
    const data = candidates.map(c => ({
        'ID': c.id,
        'Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
        'Name': c.full_name || '',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Location': c.location || '',
        'Experience': c.years_experience || '',
        'Certifications': c.certifications || '',
        'Score': c.total_score || '',
        'Rating': c.fit_rating || '',
        'Status': c.status || 'new'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
        { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 40 },
        { wch: 8 }, { wch: 8 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function exportMatchesToExcel(client, matches) {
    const summaryData = [{
        'Client': client.company_name || client.full_name,
        'Industry': client.industry || '',
        'Total Matches': matches.length,
        'Export Date': new Date().toLocaleString()
    }];

    const matchData = matches.map((m, idx) => ({
        'Rank': idx + 1,
        'Score': m.matchScore || '',
        'Grade': m.matchGrade || '',
        'Name': m.candidate?.full_name || '',
        'Email': m.candidate?.email || '',
        'Rating': m.candidate?.fit_rating || '',
        'Certs': m.candidate?.certifications || ''
    }));

    const wb = XLSX.utils.book_new();

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    const matchWs = XLSX.utils.json_to_sheet(matchData);
    XLSX.utils.book_append_sheet(wb, matchWs, 'Matches');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { exportClientsToExcel, exportCandidatesToExcel, exportMatchesToExcel };
