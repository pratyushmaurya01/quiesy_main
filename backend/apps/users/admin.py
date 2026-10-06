from django.contrib import admin
from .models import User

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'role', 'is_staff', 'is_active', 'is_verified')
    list_filter = ('role', 'is_active', 'is_staff', 'is_verified')
    search_fields = ('email', 'name')
    ordering = ('-id',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'role')}),
        ('Status', {'fields': ('is_active', 'is_verified', 'verification_otp', 'otp_created_at')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
