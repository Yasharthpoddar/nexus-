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
  // Parse the CSV — support BOM, trim whitespace, accept multiple column name variants
  let records;
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (parseErr) {
    throw new Error(`CSV parse error: ${parseErr.message}`);
  }

  let inserted   = 0;
  let flagged    = 0;
  const rowErrors = [];

  for (const record of records) {
    try {
      // Accept multiple header variants
      const rollNo = (
        record['roll_number'] ||
        record['Roll No']     ||
        record['ROLL NO']     ||
        record['rollNo']      ||
        record['Roll Number'] ||
        record['roll no']     ||
        ''
      ).trim();

      const name = (
        record['name'] || record['Name'] || record['NAME'] || ''
      ).trim();

      const amount = parseFloat(
        record['amount_due']  ||
        record['Amount Due']  ||
        record['AMOUNT DUE']  ||
        record['amount']      ||
        record['Amount']      ||
        '0'
      ) || 0;

      const reason = (
        record['reason'] || record['Reason'] || record['REASON'] ||
        record['description'] || record['Description'] || ''
      ).trim();

      if (!rollNo) {
        rowErrors.push(`Row missing roll_number: ${JSON.stringify(record)}`);
        continue;
      }

      // Find the student by roll number
      const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('roll_number', rollNo)
        .eq('role', 'student')
        .limit(1);

      if (userErr || !users || users.length === 0) {
        rowErrors.push(`Student not found for roll_number: ${rollNo}`);
        continue;
      }

      const studentId = users[0].id;

      // Insert dues_flag record
      const { error: insertErr } = await supabase
        .from('dues_flags')
        .insert([{
          user_id:    studentId,
          department: department,
          amount:     amount,
          reason:     reason || `${department} dues`,
          is_paid:    false,
        }]);

      if (insertErr) {
        rowErrors.push(`DB insert failed for ${rollNo}: ${insertErr.message}`);
        continue;
      }

      inserted++;
      flagged++;
    } catch (rowErr) {
      rowErrors.push(`Error on row ${JSON.stringify(record)}: ${rowErr.message}`);
    }
  }

  return {
    inserted,
    flagged,
    errors: rowErrors.length,
    errorDetails: rowErrors,
  };
}

module.exports = { parseAndInsertDues };
