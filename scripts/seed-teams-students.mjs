import fs from "fs";
import path from "path";
import process from "process";
import * as XLSX from "xlsx/xlsx.mjs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// Configure xlsx to use Node's fs for readFile support
XLSX.set_fs(fs);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function parseRow(row) {
  // Adjust these keys/indices to match your EList.xlsx structure
  // Expected: level+number, team letter, student names (semicolon-separated), roll numbers (semicolon-separated)
  const levelAndNumber = row[0];
  const teamLetter = row[1];
  const namesRaw = row[2];
  const rollsRaw = row[3];

  if (!levelAndNumber || !teamLetter || !namesRaw || !rollsRaw) {
    return null;
  }

  const displayName = `${String(levelAndNumber).trim()}-${String(teamLetter).trim()}`;

  const levelMatch = String(levelAndNumber).match(/(UH|H|M|L|X)/i);
  const level = levelMatch ? levelMatch[1].toUpperCase() : "X";

  const names = String(namesRaw)
    .split(";")
    .map((n) => n.trim())
    .filter(Boolean);
  const rolls = String(rollsRaw)
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean);

  const students = [];
  const count = Math.min(names.length, rolls.length);
  for (let i = 0; i < count; i++) {
    students.push({ name: names[i], roll_no: rolls[i] });
  }

  if (!students.length) return null;

  return { displayName, level, students };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run seed -- ./data/EList.xlsx");
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`Reading ${absPath}...`);
  const workbook = XLSX.readFile(absPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row if present; you can adjust this logic as needed
  const dataRows = rows.slice(1);

  for (const row of dataRows) {
    const parsed = parseRow(row);
    if (!parsed) continue;

    const { displayName, level, students } = parsed;

    console.log(`Upserting team ${displayName} with ${students.length} students...`);

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .upsert(
        {
          display_name: displayName,
          level,
        },
        { onConflict: "display_name" },
      )
      .select()
      .single();

    if (teamError) {
      console.error("Error upserting team", displayName, teamError);
      continue;
    }

    const teamId = team.id;

    const studentRows = students.map((s) => ({
      name: s.name,
      roll_no: s.roll_no,
      team_id: teamId,
    }));

    const { error: studentsError } = await supabase.from("students").upsert(studentRows, {
      onConflict: "roll_no",
    });

    if (studentsError) {
      console.error("Error upserting students for team", displayName, studentsError);
    }
  }

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

