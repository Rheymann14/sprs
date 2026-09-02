<?php

namespace App\Exports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RawIncidentWorkbook
{
    /**
     * @param  array<int, array<string, mixed>>  $incidents
     */
    public function write(array $incidents, string $target): void
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getProperties()
            ->setCreator(config('app.name'))
            ->setTitle('Raw Incidents');

        $worksheet = $spreadsheet->getActiveSheet();
        $worksheet->setTitle('Raw Incidents');
        $worksheet->fromArray([
            'Date Filed',
            'Incident Number',
            'Incident Type',
            'Subcategory',
            'Region',
            'Status',
            'Form Answers',
        ], null, 'A1');

        foreach ($incidents as $index => $incident) {
            $worksheet->fromArray([
                $incident['created_at'],
                $incident['incident_number'],
                $incident['incident_type'],
                $incident['subcategory'],
                $incident['region'],
                $incident['status'],
                $incident['answers_text'],
            ], null, 'A'.($index + 2));
        }

        $lastRow = count($incidents) + 1;
        $worksheet->freezePane('A2');
        $worksheet->setAutoFilter("A1:G{$lastRow}");
        $worksheet->getStyle('A1:G1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2563EB'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
        ]);
        $worksheet->getStyle("A1:G{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        if ($lastRow > 1) {
            $worksheet->getStyle("A2:G{$lastRow}")->getAlignment()
                ->setVertical(Alignment::VERTICAL_TOP)
                ->setWrapText(true);
        }

        foreach ([
            'A' => 22,
            'B' => 24,
            'C' => 24,
            'D' => 24,
            'E' => 24,
            'F' => 18,
            'G' => 60,
        ] as $column => $width) {
            $worksheet->getColumnDimension($column)->setWidth($width);
        }

        (new Xlsx($spreadsheet))->save($target);
        $spreadsheet->disconnectWorksheets();
    }
}
