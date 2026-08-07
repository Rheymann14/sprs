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
        foreach (['Region I', 'Region II', 'Region III', 'Region IV'] as $name) {
            Region::query()->firstOrCreate(['name' => $name]);
        }
    }
}
