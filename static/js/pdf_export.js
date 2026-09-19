/* =============================================
   INTERVIEW AI — NEO-BRUTALISM PDF REPORT EXPORT
   High-Fidelity Vector PDF Generator using jsPDF
   ============================================= */

function exportPDF() {
    if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
        alert('PDF generator library is loading. Please try again in a few seconds.');
        return;
    }

    var jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : jspdf.jsPDF;
    var doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // 1. Gather Report Data
    var reportData = null;
    var rawDataElem = document.getElementById('interviewReportData');
    if (rawDataElem && rawDataElem.textContent.trim()) {
        try {
            reportData = JSON.parse(rawDataElem.textContent);
        } catch (e) {
            console.warn('Could not parse #interviewReportData JSON, falling back to DOM scraper', e);
        }
    }

    // Fallback: scrape from DOM if JSON tag not present
    if (!reportData) {
        var skillText = (document.querySelector('.grade-detail') || {}).textContent || 'TECHNICAL SKILL';
        var skillParts = skillText.split('//');
        var skill = skillParts[0] ? skillParts[0].trim() : 'Skill';
        var difficulty = skillParts[1] ? skillParts[1].trim() : 'MEDIUM';

        var grade = ((document.querySelector('.grade-text') || {}).textContent || 'EVALUATED').trim();
        var avgScore = ((document.querySelector('.grade-score-value') || {}).textContent || '0').trim();

        var statValues = document.querySelectorAll('.report-stat-value');
        var totalScore = statValues[0] ? statValues[0].textContent.trim() : '0';
        var questionsAttempted = statValues[2] ? statValues[2].textContent.trim().split('/')[0] : '10';
        var duration = statValues[3] ? statValues[3].textContent.trim() : '0s';

        var responses = [];
        var cards = document.querySelectorAll('.question-card, .question-report-card');
        cards.forEach(function(card, idx) {
            var qNumText = (card.querySelector('.question-num') || {}).textContent || ('Q' + (idx + 1));
            var num = parseInt(qNumText.replace(/\D/g, '')) || (idx + 1);
            var scoreBadge = (card.querySelector('.question-score, .question-score-badge') || {}).textContent || '';
            var scoreVal = parseFloat(scoreBadge.replace(/[^0-9.]/g, '')) || null;

            var qText = '';
            var ansText = '';
            var fbText = '';
            var strengths = [];
            var improvements = [];
            var tips = [];

            var sections = card.querySelectorAll('.report-section');
            sections.forEach(function(sec) {
                var header = (sec.querySelector('h4, .report-section-title') || {}).textContent || '';
                var p = (sec.querySelector('p') || {}).textContent || '';
                var lis = sec.querySelectorAll('li');

                if (header.includes('QUESTION')) qText = p.trim();
                else if (header.includes('ANSWER')) ansText = p.trim();
                else if (header.includes('FEEDBACK')) fbText = p.trim();
                else if (header.includes('STRENGTH')) {
                    lis.forEach(function(li) { strengths.push(li.textContent.replace(/^\[\+\]\s*/, '').trim()); });
                } else if (header.includes('IMPROVEMENT')) {
                    lis.forEach(function(li) { improvements.push(li.textContent.replace(/^\[\!\]\s*/, '').trim()); });
                } else if (header.includes('CONFIDENCE') || header.includes('TIP')) {
                    lis.forEach(function(li) { tips.push(li.textContent.replace(/^\[\*\]\s*/, '').trim()); });
                }
            });

            responses.push({
                question_number: num,
                question: qText,
                user_answer: ansText,
                ai_score: scoreVal,
                ai_feedback: fbText,
                strengths: strengths,
                improvements: improvements,
                confidence_tips: tips
            });
        });

        reportData = {
            id: window.location.pathname.replace(/[^0-9]/g, '') || '01',
            candidate_name: 'CANDIDATE',
            skill: skill,
            difficulty: difficulty,
            total_score: totalScore,
            avg_score: avgScore,
            questions_attempted: questionsAttempted,
            duration: duration,
            grade: grade,
            created_at: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            responses: responses
        };
    }

    // Colors
    var C_BLACK = [0, 0, 0];
    var C_WHITE = [255, 255, 255];
    var C_LIME = [188, 255, 79];       // #BCFF4F
    var C_YELLOW = [255, 230, 0];      // #FFE600
    var C_CORAL = [255, 77, 77];       // #FF4D4D
    var C_GRAY_BG = [244, 244, 244];
    var C_GRAY_LINE = [210, 210, 210];
    var C_GRAY_TEXT = [100, 100, 100];
    var C_DARK_TEXT = [30, 30, 30];

    var marginX = 14;
    var contentWidth = 182;
    var currentY = 14;

    function drawHardBox(x, y, w, h, fillColor, shadowOffset) {
        shadowOffset = shadowOffset || 2;
        // Hard Shadow
        doc.setFillColor(0, 0, 0);
        doc.rect(x + shadowOffset, y + shadowOffset, w, h, 'F');
        // Foreground Card
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.rect(x, y, w, h, 'FD');
    }

    function checkPageBreak(neededHeight) {
        if (currentY + neededHeight > 275) {
            doc.addPage();
            currentY = 18;
            // Running top header on subsequent pages
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.8);
            doc.line(marginX, 12, marginX + contentWidth, 12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
            doc.text('INTERVIEW AI // TECHNICAL AUDIT: ' + (reportData.skill || '').toUpperCase(), marginX, 9);
            doc.text('ID #' + (reportData.id || ''), marginX + contentWidth, 9, { align: 'right' });
        }
    }

    // ==========================================
    // 1. BRAND HEADER (Top banner)
    // ==========================================
    drawHardBox(marginX, currentY, contentWidth, 22, C_BLACK, 2.5);

    // Accent square
    doc.setFillColor(C_LIME[0], C_LIME[1], C_LIME[2]);
    doc.rect(marginX + 4, currentY + 4, 14, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('AI', marginX + 11, currentY + 13, { align: 'center' });

    // Logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text('INTERVIEW AI', marginX + 22, currentY + 11);

    doc.setFontSize(8);
    doc.setTextColor(C_LIME[0], C_LIME[1], C_LIME[2]);
    doc.text('CANDIDATE TECHNICAL PERFORMANCE AUDIT', marginX + 22, currentY + 17);

    // Right details
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text((reportData.created_at || new Date().toDateString()).toUpperCase(), marginX + contentWidth - 4, currentY + 10, { align: 'right' });
    doc.setTextColor(C_LIME[0], C_LIME[1], C_LIME[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDIT #' + String(reportData.id).padStart(4, '0'), marginX + contentWidth - 4, currentY + 16, { align: 'right' });

    currentY += 27;

    // ==========================================
    // 2. CANDIDATE & SESSION META BAR
    // ==========================================
    drawHardBox(marginX, currentY, contentWidth, 16, C_WHITE, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('CANDIDATE:', marginX + 4, currentY + 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text((reportData.candidate_name || 'Candidate') + (reportData.candidate_email ? ' (' + reportData.candidate_email + ')' : ''), marginX + 26, currentY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.text('TARGET SKILL:', marginX + 105, currentY + 6.5);
    doc.setFillColor(C_LIME[0], C_LIME[1], C_LIME[2]);
    doc.rect(marginX + 130, currentY + 2.5, 48, 6, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text((reportData.skill || '').toUpperCase() + ' // ' + (reportData.difficulty || '').toUpperCase(), marginX + 154, currentY + 6.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C_GRAY_TEXT[0], C_GRAY_TEXT[1], C_GRAY_TEXT[2]);
    doc.text('STATUS: SESSION COMPLETED', marginX + 4, currentY + 12.5);
    doc.text('QUESTIONS EVALUATED: ' + (reportData.questions_attempted || '10') + ' / 10', marginX + 105, currentY + 12.5);

    currentY += 21;

    // ==========================================
    // 3. EXECUTIVE HERO GRADE BANNER
    // ==========================================
    var avgFloat = parseFloat(reportData.avg_score) || 0;
    var bannerBg = avgFloat >= 7.0 ? C_LIME : (avgFloat >= 5.0 ? C_YELLOW : C_WHITE);
    drawHardBox(marginX, currentY, contentWidth, 28, bannerBg, 2.5);

    // Left info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.setFillColor(0, 0, 0);
    doc.rect(marginX + 5, currentY + 4, 38, 5, 'F');
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text('OVERALL RATING', marginX + 24, currentY + 7.5, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text((reportData.grade || 'COMPLETED').toUpperCase(), marginX + 5, currentY + 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
    doc.text('VERIFIED TECHNICAL INTERVIEW SIMULATION', marginX + 5, currentY + 23);

    // Right big score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text(String(reportData.avg_score || '0.0'), marginX + contentWidth - 26, currentY + 18, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('/ 10', marginX + contentWidth - 6, currentY + 14, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
    doc.text('AVERAGE SCORE', marginX + contentWidth - 6, currentY + 22, { align: 'right' });

    currentY += 33;

    // ==========================================
    // 4. METRICS 4-COLUMN MATRIX
    // ==========================================
    var colW = (contentWidth - (3 * 3)) / 4;
    var metrics = [
        { label: 'TOTAL SCORE', val: String(reportData.total_score || '0') + ' PTS' },
        { label: 'AVG SCORE', val: String(reportData.avg_score || '0.0') + ' / 10' },
        { label: 'COMPLETION', val: String(reportData.questions_attempted || '10') + ' / 10' },
        { label: 'DURATION', val: String(reportData.duration || '0') + (String(reportData.duration).endsWith('s') ? '' : 's') }
    ];

    for (var m = 0; m < metrics.length; m++) {
        var boxX = marginX + (m * (colW + 3));
        drawHardBox(boxX, currentY, colW, 16, C_WHITE, 1.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
        doc.text(metrics[m].val, boxX + (colW / 2), currentY + 7.5, { align: 'center' });

        doc.setFontSize(6.5);
        doc.setTextColor(C_GRAY_TEXT[0], C_GRAY_TEXT[1], C_GRAY_TEXT[2]);
        doc.text(metrics[m].label, boxX + (colW / 2), currentY + 12.5, { align: 'center' });
    }

    currentY += 22;

    // ==========================================
    // 5. QUESTIONS SECTION DIVIDER
    // ==========================================
    doc.setFillColor(0, 0, 0);
    doc.rect(marginX, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_LIME[0], C_LIME[1], C_LIME[2]);
    doc.text('// DETAILED QUESTION-BY-QUESTION BREAKDOWN', marginX + 4, currentY + 5.5);
    currentY += 12;

    // ==========================================
    // 6. QUESTION CARDS RENDERING
    // ==========================================
    var responses = reportData.responses || [];

    for (var i = 0; i < responses.length; i++) {
        var resp = responses[i];
        var qNum = resp.question_number || (i + 1);
        var qScore = (resp.ai_score !== null && resp.ai_score !== undefined) ? resp.ai_score : '--';
        var scoreNum = parseFloat(qScore);

        // Calculate card elements heights
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        var qLines = doc.splitTextToSize((resp.question || 'No question text').trim(), contentWidth - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        var ansText = (resp.user_answer || '(Candidate did not provide an answer / skipped this question)').trim();
        var aLines = doc.splitTextToSize(ansText, contentWidth - 18);

        var fbText = (resp.ai_feedback || 'Evaluation completed.').trim();
        var fbLines = doc.splitTextToSize(fbText, contentWidth - 14);

        var strengths = resp.strengths || [];
        var improvements = resp.improvements || [];
        var tips = resp.confidence_tips || [];

        // Estimate vertical space required
        var cardInnerH = 8; // Header height
        cardInnerH += 6 + (qLines.length * 4); // Question label + lines
        cardInnerH += 7 + (aLines.length * 3.8) + 4; // Answer box label + lines + padding
        cardInnerH += 6 + (fbLines.length * 3.8); // Feedback label + lines

        // Strengths & Improvements
        var listItemsCount = strengths.length + improvements.length + tips.length;
        if (listItemsCount > 0) {
            cardInnerH += 5 + (listItemsCount * 4.2);
        }
        cardInnerH += 4; // bottom margin

        // Page break check
        checkPageBreak(cardInnerH + 6);

        // Card container
        drawHardBox(marginX, currentY, contentWidth, cardInnerH, C_WHITE, 2);

        // Header bar of the question card
        var headerBg = (!isNaN(scoreNum) && scoreNum >= 8) ? C_LIME : ((!isNaN(scoreNum) && scoreNum >= 5) ? C_YELLOW : C_CORAL);
        doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(marginX, currentY, contentWidth, 8, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
        doc.text('QUESTION ' + String(qNum).padStart(2, '0'), marginX + 4, currentY + 5.5);

        // Score Badge
        var scoreStr = 'SCORE: ' + (qScore !== '--' ? (qScore + ' / 10') : 'NOT SCORED');
        doc.text(scoreStr, marginX + contentWidth - 4, currentY + 5.5, { align: 'right' });

        var innerY = currentY + 12;

        // --- Question text ---
        doc.setFillColor(0, 0, 0);
        doc.rect(marginX + 4, innerY - 2.5, 24, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
        doc.text('QUESTION', marginX + 16, innerY + 0.5, { align: 'center' });

        innerY += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
        for (var ql = 0; ql < qLines.length; ql++) {
            doc.text(qLines[ql], marginX + 4, innerY);
            innerY += 4;
        }

        // --- Candidate Answer (styled in bordered gray box) ---
        innerY += 2;
        var ansBoxH = (aLines.length * 3.8) + 7;
        doc.setFillColor(C_GRAY_BG[0], C_GRAY_BG[1], C_GRAY_BG[2]);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(marginX + 4, innerY, contentWidth - 8, ansBoxH, 'FD');
        // Left thick accent line
        doc.setFillColor(0, 0, 0);
        doc.rect(marginX + 4, innerY, 2.5, ansBoxH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(C_GRAY_TEXT[0], C_GRAY_TEXT[1], C_GRAY_TEXT[2]);
        doc.text('CANDIDATE RESPONSE:', marginX + 10, innerY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
        var aY = innerY + 8;
        for (var al = 0; al < aLines.length; al++) {
            doc.text(aLines[al], marginX + 10, aY);
            aY += 3.8;
        }

        innerY += ansBoxH + 4;

        // --- AI Evaluation & Feedback ---
        doc.setFillColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
        doc.rect(marginX + 4, innerY - 2.5, 26, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(C_LIME[0], C_LIME[1], C_LIME[2]);
        doc.text('AI FEEDBACK', marginX + 17, innerY + 0.5, { align: 'center' });

        innerY += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
        for (var fl = 0; fl < fbLines.length; fl++) {
            doc.text(fbLines[fl], marginX + 4, innerY);
            innerY += 3.8;
        }

        // --- Strengths, Improvements, Tips Lists ---
        if (strengths.length > 0 || improvements.length > 0 || tips.length > 0) {
            innerY += 2;

            for (var si = 0; si < strengths.length; si++) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(34, 197, 94); // Green
                doc.text('[+]', marginX + 4, innerY);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
                var sLines = doc.splitTextToSize(strengths[si], contentWidth - 16);
                doc.text(sLines, marginX + 11, innerY);
                innerY += (sLines.length * 3.8);
            }

            for (var im = 0; im < improvements.length; im++) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(234, 88, 12); // Orange
                doc.text('[!]', marginX + 4, innerY);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
                var impLines = doc.splitTextToSize(improvements[im], contentWidth - 16);
                doc.text(impLines, marginX + 11, innerY);
                innerY += (impLines.length * 3.8);
            }

            for (var ti = 0; ti < tips.length; ti++) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(59, 130, 246); // Blue
                doc.text('[*]', marginX + 4, innerY);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(C_DARK_TEXT[0], C_DARK_TEXT[1], C_DARK_TEXT[2]);
                var tipLines = doc.splitTextToSize(tips[ti], contentWidth - 16);
                doc.text(tipLines, marginX + 11, innerY);
                innerY += (tipLines.length * 3.8);
            }
        }

        currentY += cardInnerH + 6;
    }

    // ==========================================
    // 7. GLOBAL FOOTER ON ALL PAGES
    // ==========================================
    var totalPages = doc.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // Footer dividing line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(marginX, 287, marginX + contentWidth, 287);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
        doc.text('INTERVIEW AI AUDIT ENGINE // CANDIDATE CONFIDENTIAL // ZERO DATA DRIFT', marginX, 292);

        doc.setFont('helvetica', 'bold');
        doc.text('PAGE ' + p + ' OF ' + totalPages, marginX + contentWidth, 292, { align: 'right' });
    }

    // ==========================================
    // 8. SAVE FILE
    // ==========================================
    var safeSkill = (reportData.skill || 'Interview').replace(/[^a-zA-Z0-9]/g, '_');
    var fileName = 'Interview_AI_Report_' + safeSkill + '_Session_' + (reportData.id || 'Audit') + '.pdf';
    doc.save(fileName);

    if (typeof showToast === 'function') {
        showToast('Official PDF Report Generated Successfully!', 'success');
    }
}
