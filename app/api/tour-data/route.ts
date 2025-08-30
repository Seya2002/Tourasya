import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_FILE_PATH = path.join(
  process.cwd(),
  'ml_backend',
  'recommendation_model',
  'SRI_LANKA_TOUR_DATASET.xlsx'
);

interface TourData {
  id?: number;
  'Tourist country': string;
  Month: string;
  Duration: string;
  'Price USD': string;
  Location: string;
  Interest: string;
  Activities: string;
  'Overnight_stay': string;
}

// ✅ Utility function: safely read workbook
function readWorkbook(): XLSX.WorkBook {
  const buffer = fs.readFileSync(EXCEL_FILE_PATH);
  return XLSX.read(buffer, { type: 'buffer' });
}

// ✅ Utility function: safely write workbook
function writeWorkbook(workbook: XLSX.WorkBook) {
  const wbout = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(EXCEL_FILE_PATH, wbout);
}

// GET - Read data from Excel file
export async function GET() {
  try {
    console.log('🔍 Reading Excel file from:', EXCEL_FILE_PATH);

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      return NextResponse.json({ data: [] });
    }

    const workbook = readWorkbook();
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
      defval: '',
      blankrows: false,
    });

    const structuredData: TourData[] = jsonData.map((row: any, index: number) => ({
      id: index + 1,
      'Tourist country':
        row['Tourist country'] ||
        row['Touristcountry'] ||
        row['Country'] ||
        '',
      Month: row['Month'] || '',
      Duration: row['Duration'] || '',
      'Price USD': row['Price USD'] || row['PriceUSD'] || row['Price'] || '',
      Location: row['Location'] || '',
      Interest: row['Interest'] || '',
      Activities: row['Activities'] || '',
      'Overnight_stay':
        row['Overnight_stay'] || row['Overnightstay'] || row['Stay'] || '',
    }));

    return NextResponse.json({ data: structuredData });
  } catch (error: unknown) {
    console.error('❌ Error in GET /api/tour-data:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to read Excel file: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Write data to Excel file
export async function POST(request: NextRequest) {
  try {
    const { data }: { data: TourData[] } = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const dataForExcel = data.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    writeWorkbook(workbook);

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
    });
  } catch (error: unknown) {
    console.error('❌ Error writing Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to save data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete record by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    const workbook = readWorkbook();
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<TourData>(worksheet);

    const filteredData = jsonData.filter(
      (_, index) => (index + 1).toString() !== id
    );

    const newWorksheet = XLSX.utils.json_to_sheet(filteredData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

    writeWorkbook(newWorkbook);

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error: unknown) {
    console.error('❌ Error deleting record:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to delete record: ${errorMessage}` },
      { status: 500 }
    );
  }
}
