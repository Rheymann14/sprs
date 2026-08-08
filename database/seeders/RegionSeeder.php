<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            'Regional Office I',
            'Regional Office II',
            'Regional Office III',
            'Regional Office IV',
            'Regional Office V',
            'Regional Office VI',
            'Regional Office VII',
            'Regional Office VIII',
            'Regional Office IX',
            'Regional Office X',
            'Regional Office XI',
            'Regional Office XII',
            'Regional Office CAR',
            'Regional Office CARAGA',
            'Regional Office MIMAROPA',
            'Regional Office NCR',
            'Regional Office NIR',
        ];

        foreach ($regions as $name) {
            Region::query()->firstOrCreate(['name' => $name]);
        }
    }
}
