import { API_BASE_URL } from '../services/config';

/**
 * Downloads official Railpad Annexures PDF using the Case Letter Info API:
 * GET /case-letter/info/{callNo} (e.g. https://api.ritesqasarthi.com/sarthi-backend/api/case-letter/info/{callNo})
 *
 * If found: Downloads the verified Annexure / Case Letter document.
 * If not found: Throws user-friendly error "Annexure could not find for call no : {callNo}".
 */
export const generateRailpadAnnexurePDF = async (call, shouldDownload = true) => {
    if (!call) {
        throw new Error("No call details provided.");
    }

    const rawCallNo = call.callNo || call.call_no || call.requestId || call.inspectionCallNo || '';
    if (!rawCallNo) {
        throw new Error("Annexure could not find for call no : Unknown");
    }

    const cleanCallNo = String(rawCallNo).trim();

    // Candidate keys to check across call number variants
    const candidateKeys = Array.from(new Set([
        cleanCallNo,
        call.callNo,
        call.call_no,
        call.requestId,
        call.inspectionCallNo,
        call.icNumber,
        call.icNo,
        call.ic_number,
        cleanCallNo.startsWith('RPP-') ? cleanCallNo.replace('RPP-', 'ER-') : null,
        cleanCallNo.startsWith('RPP-') ? cleanCallNo.replace('RPP-', 'EP-') : null,
        cleanCallNo.startsWith('ER-') ? cleanCallNo.replace('ER-', 'RPP-') : null,
    ].filter(Boolean).map(s => String(s).trim())));

    const token = localStorage.getItem('railpad_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const baseUrls = [
        API_BASE_URL,
        'https://api.ritesqasarthi.com/sarthi-backend/api',
        'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api'
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

    let docData = null;
    let matchedCallNo = cleanCallNo;
    let matchedBaseUrl = API_BASE_URL;

    // 1. Check /ic-annexures/list?callNo=...&moduleType=RAILPAD first
    for (const bUrl of baseUrls) {
        for (const k of candidateKeys) {
            try {
                const listUrl = `${bUrl}/ic-annexures/list?callNo=${encodeURIComponent(k)}&moduleType=RAILPAD`;
                const res = await fetch(listUrl, { method: 'GET', headers });
                if (res.ok) {
                    const listJson = await res.json();
                    const docs = listJson?.data || listJson?.responseData || (Array.isArray(listJson) ? listJson : []);
                    if (Array.isArray(docs) && docs.length > 0 && docs[0]) {
                        const first = docs[0];
                        const rawDocId = first.id || first.documentId;
                        docData = {
                            source: 'ic-annexures',
                            id: rawDocId,
                            blobUrl: first.blobUrl || first.fileUrl || (rawDocId ? `${bUrl}/ic-annexures/download/${rawDocId}` : null),
                            originalFileName: first.originalFileName || first.fileName || `Annexure_${k}.pdf`
                        };
                        matchedCallNo = k;
                        matchedBaseUrl = bUrl;
                        break;
                    }
                }
            } catch (_) {}
        }
        if (docData) break;
    }

    // 2. Check official API: GET /case-letter/info/{callNo} if /ic-annexures didn't match
    if (!docData) {
        for (const bUrl of baseUrls) {
            for (const k of candidateKeys) {
                try {
                    const infoUrl = `${bUrl}/case-letter/info/${encodeURIComponent(k)}`;
                    const res = await fetch(infoUrl, { method: 'GET', headers });
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.exists && json.data) {
                            docData = {
                                ...json.data,
                                source: 'case-letter'
                            };
                            matchedCallNo = k;
                            matchedBaseUrl = bUrl;
                            break;
                        }
                    }
                } catch (err) {
                    // Connection or CORS error on this endpoint, continue
                }
            }
            if (docData) break;
        }
    }

    // 3. If NOT found: Throw exact user-facing error message
    if (!docData) {
        throw new Error(`Annexure could not find for call no : ${cleanCallNo}`);
    }

    // 4. Download or open the found Annexure document (authenticated backend stream first)
    const finalFileName = docData.originalFileName || `Annexure_${matchedCallNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    const dlHeaders = {
        'Accept': 'application/pdf, */*',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const backendEndpoints = docData.source === 'ic-annexures'
        ? [
            docData.id ? `${matchedBaseUrl}/ic-annexures/download/${docData.id}` : null,
            docData.blobUrl
        ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i)
        : [
            `${matchedBaseUrl}/case-letter/download/${encodeURIComponent(matchedCallNo)}`,
            `${matchedBaseUrl}/case-letter/view/${encodeURIComponent(matchedCallNo)}`,
            cleanCallNo !== matchedCallNo ? `${matchedBaseUrl}/case-letter/download/${encodeURIComponent(cleanCallNo)}` : null,
            cleanCallNo !== matchedCallNo ? `${matchedBaseUrl}/case-letter/view/${encodeURIComponent(cleanCallNo)}` : null
        ].filter(Boolean);

    for (const dlUrl of backendEndpoints) {
        try {
            const resp = await fetch(dlUrl, { method: 'GET', headers: dlHeaders });
            if (resp.ok) {
                const blob = await resp.blob();
                if (blob && blob.size > 0) {
                    const objUrl = window.URL.createObjectURL(blob);
                    if (shouldDownload) {
                        const a = document.createElement('a');
                        a.href = objUrl;
                        a.download = finalFileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => window.URL.revokeObjectURL(objUrl), 5000);
                    } else {
                        window.open(objUrl, '_blank');
                    }
                    return { success: true, blob, fileName: finalFileName, url: objUrl };
                }
            }
        } catch (_) {}
    }

    if (docData.blobUrl && !String(docData.blobUrl).includes('/ic-annexures/download/')) {
        if (shouldDownload) {
            const link = document.createElement('a');
            link.href = docData.blobUrl;
            link.download = finalFileName;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            window.open(docData.blobUrl, '_blank');
        }
        return { success: true, fileName: finalFileName, url: docData.blobUrl };
    }

    throw new Error(`Annexure could not find for call no : ${cleanCallNo}`);
};

export default generateRailpadAnnexurePDF;
