const PDFDocument = require('pdfkit');

/**
 * Streams a simple multi-page student report as PDF.
 * @param {object} params
 * @param {import('stream').Writable} params.stream
 */
function generateStudentReportPdf({ stream, user, attempt, quiz, proctorSummary }) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  doc.fontSize(20).text('SkillTrove — Quiz Report', { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(`Student: ${user.name}`, { continued: false });
  doc.text(`Email: ${user.email}`);
  doc.text(`Report generated: ${new Date().toISOString()}`);
  doc.moveDown();

  doc.fontSize(14).text('Assessment', { underline: true });
  doc.fontSize(11).text(`Subject / quiz topic: ${quiz.subject}`);
  doc.text(`Attempt ID: ${attempt._id}`);
  doc.text(`Completed: ${attempt.completedAt ? attempt.completedAt.toISOString() : 'N/A'}`);
  doc.text(`Score: ${attempt.totalScore.toFixed(1)} / ${attempt.maxScore} (${quiz.questions?.length ?? 0} questions)`);
  doc.moveDown();

  if (proctorSummary) {
    doc.fontSize(14).text('Proctoring highlights', { underline: true });
    doc.fontSize(11);
    doc.text(JSON.stringify(proctorSummary, null, 2), { align: 'left' });
    doc.moveDown();
  }

  doc.fontSize(14).text('Detailed feedback', { underline: true });
  doc.moveDown(0.5);
  attempt.responses.forEach((r, idx) => {
    const q = quiz.questions?.[r.questionIndex];
    doc.fontSize(11).fillColor('#111').text(`${idx + 1}. [${r.type}] — ${((r.score / (r.maxPoints || 1)) * 100).toFixed(0)}% (${r.score}/${r.maxPoints})`);
    if (q) doc.fillColor('#333').fontSize(10).text(`Prompt: ${q.prompt}`, { paragraphGap: 2 });
    doc.fillColor('#555').fontSize(9).text(`Your answer: ${r.answer}`);
    doc.text(`Feedback: ${r.feedback}`);
    doc.moveDown();
  });

  doc.end();
}

module.exports = { generateStudentReportPdf };
