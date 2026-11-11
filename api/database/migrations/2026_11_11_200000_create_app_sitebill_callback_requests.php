<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_sitebill_callback_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('name', 100);
            $table->string('phone', 30);
            $table->string('comment', 500)->nullable();
            $table->unsignedBigInteger('property_id')->nullable();
            // The lead created in the site's CRM (Host::crm()->createLead).
            $table->unsignedBigInteger('lead_id')->nullable();
            // new | done
            $table->string('status', 10)->default('new');
            $table->timestamps();
            $table->index(['tenant_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_sitebill_callback_requests');
    }
};
