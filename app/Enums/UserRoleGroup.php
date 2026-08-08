<?php

namespace App\Enums;

enum UserRoleGroup: string
{
    case CentralOffice = 'central-office';
    case RegionalOffice = 'regional-office';
    case Agency = 'agency';

    public function label(): string
    {
        return match ($this) {
            self::CentralOffice => 'CHED Central Office',
            self::RegionalOffice => 'CHED Regional Office',
            self::Agency => 'Agency',
        };
    }
}
