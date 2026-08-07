<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_role_id']);
            $table->dropForeign(['region_id']);
        });

        Schema::table('user_roles', function (Blueprint $table) {
            $table->ulid('id')->change();
        });

        Schema::table('regions', function (Blueprint $table) {
            $table->ulid('id')->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUlid('user_role_id')->nullable()->change();
            $table->foreignUlid('region_id')->nullable()->change();
        });

        $this->replaceIdentifiersWithUlids('user_roles', 'user_role_id');
        $this->replaceIdentifiersWithUlids('regions', 'region_id');

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('user_role_id')->references('id')->on('user_roles');
            $table->foreign('region_id')->references('id')->on('regions')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_role_id']);
            $table->dropForeign(['region_id']);
        });

        $this->replaceIdentifiersWithIntegers('user_roles', 'user_role_id');
        $this->replaceIdentifiersWithIntegers('regions', 'region_id');

        Schema::table('user_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('id', true)->change();
        });

        Schema::table('regions', function (Blueprint $table) {
            $table->unsignedBigInteger('id', true)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('user_role_id')->nullable()->change();
            $table->unsignedBigInteger('region_id')->nullable()->change();
            $table->foreign('user_role_id')->references('id')->on('user_roles');
            $table->foreign('region_id')->references('id')->on('regions')->restrictOnDelete();
        });
    }

    private function replaceIdentifiersWithUlids(string $table, string $userColumn): void
    {
        foreach (DB::table($table)->orderBy('id')->pluck('id') as $identifier) {
            $ulid = (string) Str::ulid();

            DB::table('users')->where($userColumn, $identifier)->update([$userColumn => $ulid]);
            DB::table($table)->where('id', $identifier)->update(['id' => $ulid]);
        }
    }

    private function replaceIdentifiersWithIntegers(string $table, string $userColumn): void
    {
        foreach (DB::table($table)->orderBy('id')->pluck('id')->values() as $index => $identifier) {
            $integer = $index + 1;

            DB::table('users')->where($userColumn, $identifier)->update([$userColumn => $integer]);
            DB::table($table)->where('id', $identifier)->update(['id' => $integer]);
        }
    }
};
