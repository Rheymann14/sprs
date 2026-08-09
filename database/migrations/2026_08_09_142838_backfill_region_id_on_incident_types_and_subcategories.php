<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $fallbackRegionId = DB::table('regions')
            ->where('name', 'CHED Central Office')
            ->value('id') ?? DB::table('regions')->orderBy('id')->value('id');

        DB::table('incident_types')
            ->select('id')
            ->orderBy('id')
            ->get()
            ->each(function (object $incidentType) use ($fallbackRegionId): void {
                $regionId = DB::table('incident_forms')
                    ->join('incident_subcategories', 'incident_subcategories.id', '=', 'incident_forms.incident_subcategory_id')
                    ->where('incident_subcategories.incident_type_id', $incidentType->id)
                    ->whereNotNull('incident_forms.region_id')
                    ->value('incident_forms.region_id')
                    ?? DB::table('incidents')
                        ->join('incident_subcategories', 'incident_subcategories.id', '=', 'incidents.incident_subcategory_id')
                        ->where('incident_subcategories.incident_type_id', $incidentType->id)
                        ->value('incidents.region_id')
                    ?? $fallbackRegionId;

                DB::table('incident_types')
                    ->where('id', $incidentType->id)
                    ->update(['region_id' => $regionId]);
            });

        DB::table('incident_subcategories')
            ->select('id', 'incident_type_id')
            ->orderBy('id')
            ->get()
            ->each(function (object $subcategory): void {
                $regionId = DB::table('incident_forms')
                    ->where('incident_subcategory_id', $subcategory->id)
                    ->whereNotNull('region_id')
                    ->value('region_id')
                    ?? DB::table('incidents')
                        ->where('incident_subcategory_id', $subcategory->id)
                        ->value('region_id')
                    ?? DB::table('incident_types')
                        ->where('id', $subcategory->incident_type_id)
                        ->value('region_id');

                DB::table('incident_subcategories')
                    ->where('id', $subcategory->id)
                    ->update(['region_id' => $regionId]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Region ownership is retained when this data-only migration is rolled back.
    }
};
