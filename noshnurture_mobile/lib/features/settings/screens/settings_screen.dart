import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/glass.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _enableEmail = true;
  bool _enableTelegram = false;
  bool _enablePush = false;
  final String _notificationTime = '07:00 AM';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final displayName =
        (auth.userName != null && auth.userName!.trim().isNotEmpty)
        ? auth.userName!.trim()
        : ((auth.userEmail != null && auth.userEmail!.contains('@'))
              ? auth.userEmail!.split('@').first
              : 'User');
    final displayEmail =
        (auth.userEmail != null && auth.userEmail!.trim().isNotEmpty)
        ? auth.userEmail!.trim()
        : 'No email';
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.shade900,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.settings, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            const Text(
              'Settings',
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.bold,
                fontSize: 24,
                fontFamily: 'serif',
              ),
            ),
          ],
        ),
      ),
      body: GlassBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProfileCard(
                  displayName: displayName,
                  displayEmail: displayEmail,
                  initial: initial,
                ),
                const SizedBox(height: 24),
                _buildSignOutButton(),
                const SizedBox(height: 32),
                _buildNotificationsSection(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard({
    required String displayName,
    required String displayEmail,
    required String initial,
  }) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      borderRadius: BorderRadius.circular(24),
      tint: Colors.green.shade50.withOpacity(0.5),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.green.shade600,
              border: Border.all(color: Colors.white, width: 4),
            ),
            child: Center(
              child: Text(
                initial,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: 'serif',
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            displayName,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'serif',
            ),
          ),
          Text(displayEmail, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),
          _buildActionLink(
            icon: Icons.edit_note,
            title: 'Help Improve NoshNurture',
            color: Colors.orange,
          ),
          const SizedBox(height: 12),
          _buildActionLink(
            icon: Icons.bolt,
            title: 'QA Panel',
            color: Colors.teal,
          ),
        ],
      ),
    );
  }

  Widget _buildActionLink({
    required IconData icon,
    required String title,
    required MaterialColor color,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.shade200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color.shade700, size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOutButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () async {
          await context.read<AuthProvider>().logout();
        },
        icon: const Icon(Icons.logout, color: Colors.white),
        label: const Text(
          'Sign Out',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.grey.shade900,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationsSection() {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      borderRadius: BorderRadius.circular(24),
      tint: Colors.blue.shade50.withOpacity(0.4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.teal,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.notifications, color: Colors.white),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'serif',
                      ),
                    ),
                    Text(
                      'Choose how you want to be notified',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.warning_amber_rounded, size: 16),
                label: const Text('Test Alert'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Time Picker Mock
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      color: Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'DAILY REMINDER TIME',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Text(
                          _notificationTime,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        'We will check your pantry and send alerts at this time.',
                        style: TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Toggles
          _buildToggleItem(
            icon: Icons.mail,
            title: 'Email Notifications',
            subtitle: 'Daily reminders via email',
            value: _enableEmail,
            onChanged: (val) => setState(() => _enableEmail = val),
          ),
          const SizedBox(height: 12),
          _buildToggleItem(
            icon: Icons.send,
            title: 'Telegram Notifications',
            subtitle: _enableTelegram ? 'Connected' : 'Not connected',
            value: _enableTelegram,
            onChanged: (val) => setState(() => _enableTelegram = val),
          ),
          const SizedBox(height: 12),
          _buildToggleItem(
            icon: Icons.phone_android,
            title: 'Push Notifications',
            subtitle: 'Alerts on this device',
            value: _enablePush,
            onChanged: (val) => setState(() => _enablePush = val),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.grey.shade400),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: value ? Colors.green : Colors.grey,
                    fontSize: 12,
                    fontWeight: value ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: Colors.white,
            activeTrackColor: Colors.green,
            inactiveThumbColor: Colors.white,
            inactiveTrackColor: Colors.grey.shade300,
          ),
        ],
      ),
    );
  }
}
