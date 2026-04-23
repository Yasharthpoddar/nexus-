const { parse } = require('csv-parse/sync');
const supabase   = require('../db/config');

/**
 * Parse a CSV buffer and insert dues_flags rows into Supabase.
 *
 * @param {Buffer} buffer     - The raw CSV file buffer from multer memoryStorage
 * @param {string} department - Department name (lowercased), e.g. 'library'
 * @returns {{ inserted: number, flagged: number, errors: number, errorDetails: string[] }}
 */
async function parseAndInsertDues(buffer, department) {
  let records;
  try {
    const csvContent = buffer.toString('utf8');
    console.log('[Parser] First 100 chars of CSV:', csvContent.substring(0, 100));
    
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (parseErr) {
    throw new Error(`CSV format error: ${parseErr.message}`);
  }

  let inserted = 0;
  let flagged = 0;
  const rowErrors = [];

  if (records.length === 0) {
     throw new Error("CSV file appears to be empty or has no data rows.");
  }

  // Debug: Log the detected headers from the first record
  console.log('[Parser] Detected Headers:', Object.keys(records[0]));

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for header row
    try {
      const rollNo = (
        record['roll_number'] || record['Roll No'] || record['ROLL NO'] ||
        record['rollNo'] || record['Roll Number'] || record['roll no'] || ''
      ).trim();

      const amountStr = (
        record['amount_due'] || record['Amount Due'] || record['AMOUNT DUE'] ||
        record['amount'] || record['Amount'] || ''
      ).trim();

      if (!rollNo) {
        rowErrors.push(`Row ${rowNum}: Missing Roll Number column.`);
        continue;
      }
      if (!amountStr) {
        rowErrors.push(`Row ${rowNum}: Missing Amount Due column for student ${rollNo}.`);
        continue;
      }

      const amount = parseFloat(amountStr) || 0;

      const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('roll_number', rollNo)
        .eq('role', 'student')
        .limit(1);

      if (userErr) {
        rowErrors.push(`Row ${rowNum}: Database error checking student ${rollNo}: ${userErr.message}`);
        continue;
      }

      if (!users || users.length === 0) {
        rowErrors.push(`Row ${rowNum}: Student with Roll No "${rollNo}" not found in database.`);
        continue;
      }

      const studentId = users[0].id;
      const reason = (record['reason'] || record['Reason'] || record['REASON'] || record['description'] || '').trim();

      const { error: insertErr } = await supabase
        .from('dues_flags')
        .insert([{
          user_id: studentId,
          department: department,
          amount: amount,
          reason: reason || `${department} dues`,
          is_paid: false,
        }]);

      if (insertErr) {
        rowErrors.push(`Row ${rowNum}: Failed to flag ${rollNo}: ${insertErr.message}`);
        continue;
      }

      inserted++;
      flagged++;
    } catch (rowErr) {
      rowErrors.push(`Row ${rowNum}: Unexpected error: ${rowErr.message}`);
    }
  }

  return { inserted, flagged, errors: rowErrors.length, errorDetails: rowErrors };
}

module.exports = { parseAndInsertDues };
