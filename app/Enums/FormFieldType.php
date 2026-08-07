<?php

namespace App\Enums;

enum FormFieldType: string
{
    case Text = 'text';
    case Number = 'number';
    case DateTime = 'datetime';
    case Textarea = 'textarea';
    case Dropdown = 'dropdown';
    case File = 'file';
    case Checkbox = 'checkbox';
    case Radio = 'radio';
}
