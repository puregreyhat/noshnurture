import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/providers/inventory_provider.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../core/widgets/glass.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _enableEmail = true;
  bool _enableTelegram = false;
  bool _enablePush = true;
  bool _dailyReminder = true;
  TimeOfDay _notificationTime = const TimeOfDay(hour: 8, minute: 0);
  bool _isSaving = false;
  int _reminderTapCount = 0;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().fetchUserPreferences();
    });
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _enableEmail = prefs.getBool('notif_email') ?? true;
      _enableTelegram = prefs.getBool('notif_telegram') ?? false;
      _enablePush = prefs.getBool('notif_push') ?? true;
      _dailyReminder = prefs.getBool('daily_reminder') ?? true;
      final hour = prefs.getInt('notif_hour') ?? 8;
      final minute = prefs.getInt('notif_minute') ?? 0;
      _notificationTime = TimeOfDay(hour: hour, minute: minute);
    });
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);
    final inventoryProvider = context.read<InventoryProvider>();
    final authProvider = context.read<AuthProvider>();
    final messenger = ScaffoldMessenger.of(context);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notif_email', _enableEmail);
    await prefs.setBool('notif_telegram', _enableTelegram);
    await prefs.setBool('notif_push', _enablePush);
    await prefs.setBool('daily_reminder', _dailyReminder);
    await prefs.setInt('notif_hour', _notificationTime.hour);
    await prefs.setInt('notif_minute', _notificationTime.minute);

    if (_dailyReminder && _enablePush) {
      await NotificationService().scheduleDailyExpiryNotification(
        time: _notificationTime,
        items: inventoryProvider.items,
      );
    } else {
      await NotificationService().cancelDailyReminder();
    }

    // Sync with Supabase
    try {
      if (authProvider.userId != null) {
        await Supabase.instance.client.from('user_preferences').upsert({
          'user_id': authProvider.userId,
          'enable_email': _enableEmail,
          'enable_telegram': _enableTelegram,
          'enable_push': _enablePush,
          'reminder_time':
              '${_notificationTime.hour.toString().padLeft(2, '0')}:${_notificationTime.minute.toString().padLeft(2, '0')}',
        });
      }
    } catch (e) {
      debugPrint('Error syncing preferences to Supabase: $e');
    }

    if (mounted) {
      setState(() => _isSaving = false);
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Settings saved successfully'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _notificationTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.green.shade700,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _notificationTime) {
      setState(() {
        _notificationTime = picked;
      });
      _saveSettings();
    }
  }

  void _handleReminderEasterEgg() {
    _reminderTapCount++;
    if (_reminderTapCount >= 5) {
      _reminderTapCount = 0;
      NotificationService().showTestNotification();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 Easter Egg! Test notification sent.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _connectTelegram() async {
    final auth = context.read<AuthProvider>();
    if (auth.userId == null) return;

    const botUsername = 'noshnurture_bot';

    // Try direct app link first
    final appUrl = Uri.parse(
      'tg://resolve?domain=$botUsername&start=${auth.userId}',
    );
    // Fallback to browser link
    final webUrl = Uri.parse('https://t.me/$botUsername?start=${auth.userId}');

    try {
      if (await canLaunchUrl(appUrl)) {
        await launchUrl(appUrl, mode: LaunchMode.externalNonBrowserApplication);
      } else if (await canLaunchUrl(webUrl)) {
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
      } else {
        throw 'Could not launch any Telegram link';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e. Make sure Telegram is installed.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final displayName =
        (auth.userName != null && auth.userName!.trim().isNotEmpty)
        ? auth.userName!.trim()
        : 'User';
    final displayEmail =
        (auth.userEmail != null && auth.userEmail!.trim().isNotEmpty)
        ? auth.userEmail!.trim()
        : 'No email';
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200.0,
            floating: false,
            pinned: true,
            backgroundColor: Colors.green.shade800,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.green.shade800, Colors.green.shade600],
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white24,
                      child: Text(
                        initial,
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      displayEmail,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Notifications'),
                  const SizedBox(height: 12),
                  _buildSettingCard(
                    child: Column(
                      children: [
                        _buildToggleTile(
                          icon: Icons.notifications_active_outlined,
                          title: 'Daily Expiry Reminder',
                          subtitle: 'Alerts for items expiring in 1-2 days',
                          value: _dailyReminder,
                          onChanged: (val) {
                            setState(() => _dailyReminder = val);
                            _saveSettings();
                            _handleReminderEasterEgg();
                          },
                        ),
                        if (_dailyReminder) ...[
                          const Divider(indent: 56),
                          _buildClickableTile(
                            icon: Icons.access_time,
                            title: 'Reminder Time',
                            trailing: Text(
                              _formatTimeOfDay(_notificationTime),
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            onTap: () => _selectTime(context),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Notification Channels'),
                  const SizedBox(height: 12),
                  _buildSettingCard(
                    child: Column(
                      children: [
                        _buildToggleTile(
                          icon: Icons.mail_outline,
                          title: 'Email',
                          value: _enableEmail,
                          onChanged: (val) {
                            setState(() => _enableEmail = val);
                            _saveSettings();
                          },
                        ),
                        const Divider(indent: 56),
                        _buildToggleTile(
                          icon: Icons.telegram_outlined,
                          title: 'Telegram',
                          value: _enableTelegram,
                          onChanged: (val) {
                            if (val && auth.telegramChatId == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Please connect the Telegram bot first',
                                  ),
                                  backgroundColor: Color(0xFFE2725B),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                              return;
                            }
                            setState(() => _enableTelegram = val);
                            _saveSettings();
                          },
                        ),
                        if (auth.telegramChatId == null)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            child: ElevatedButton.icon(
                              onPressed: _connectTelegram,
                              icon: const Icon(Icons.link),
                              label: const Text('Connect Telegram Bot'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(
                                  0xFFE2725B,
                                ).withOpacity(0.9),
                                foregroundColor: Colors.white,
                                minimumSize: const Size(double.infinity, 45),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          )
                        else
                          const Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  color: Colors.green,
                                  size: 16,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Telegram Bot Connected',
                                  style: TextStyle(
                                    color: Colors.green,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const Divider(indent: 56),
                        _buildToggleTile(
                          icon: Icons.phone_iphone_outlined,
                          title: 'Push Notifications',
                          value: _enablePush,
                          onChanged: (val) {
                            setState(() => _enablePush = val);
                            _saveSettings();
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Account'),
                  const SizedBox(height: 12),
                  _buildSettingCard(
                    child: Column(
                      children: [
                        _buildClickableTile(
                          icon: Icons.person_outline,
                          title: 'Edit Profile',
                          onTap: () {},
                        ),
                        const Divider(indent: 56),
                        _buildClickableTile(
                          icon: Icons.lock_outline,
                          title: 'Security',
                          onTap: () {},
                        ),
                        const Divider(indent: 56),
                        _buildClickableTile(
                          icon: Icons.logout,
                          title: 'Sign Out',
                          titleColor: Colors.red.shade700,
                          onTap: () => auth.logout(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('More'),
                  const SizedBox(height: 12),
                  _buildSettingCard(
                    child: Column(
                      children: [
                        _buildClickableTile(
                          icon: Icons.help_outline,
                          title: 'Help & Feedback',
                          onTap: () {},
                        ),
                        const Divider(indent: 56),
                        _buildClickableTile(
                          icon: Icons.info_outline,
                          title: 'About NoshNurture',
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingCard({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(borderRadius: BorderRadius.circular(20), child: child),
    );
  }

  Widget _buildToggleTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.green.shade700, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
      subtitle: subtitle != null
          ? Text(subtitle, style: const TextStyle(fontSize: 12))
          : null,
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: Colors.green.shade700,
      ),
    );
  }

  Widget _buildClickableTile({
    required IconData icon,
    required String title,
    Widget? trailing,
    required VoidCallback onTap,
    Color? titleColor,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (titleColor ?? Colors.green.shade700).withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: titleColor ?? Colors.green.shade700, size: 22),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: titleColor ?? Colors.black87,
        ),
      ),
      trailing: trailing ?? const Icon(Icons.chevron_right, color: Colors.grey),
    );
  }
}
