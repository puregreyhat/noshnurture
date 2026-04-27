import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/inventory_item.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz_data.initializeTimeZones();
    await _configureLocalTimezone();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
          requestAlertPermission: true,
          requestBadgePermission: true,
          requestSoundPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );

    await _notificationsPlugin.initialize(initializationSettings);

    final androidPlugin = _notificationsPlugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.requestNotificationsPermission();
    await androidPlugin?.requestExactAlarmsPermission();
  }

  Future<void> _configureLocalTimezone() async {
    try {
      final timezoneName = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(timezoneName));
    } catch (e) {
      debugPrint('Failed to set local timezone for notifications: $e');
    }
  }

  Future<void> scheduleDailyExpiryNotification({
    required TimeOfDay time,
    required List<InventoryItem> items,
  }) async {
    // 1. Filter items expiring in 1-2 days
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final expiringItems = items.where((item) {
      final expiry = DateTime(
        item.expiryDate.year,
        item.expiryDate.month,
        item.expiryDate.day,
      );
      final daysUntilExpiry = expiry.difference(today).inDays;
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 2;
    }).toList();

    // 2. Build message (always schedule a daily reminder at selected time)
    String message;
    if (expiringItems.isEmpty) {
      message = 'No items are expiring in the next 2 days.';
    } else {
      message = "You have ${expiringItems.length} items expiring soon: ";
      message += expiringItems.take(3).map((e) => e.name).join(", ");
      if (expiringItems.length > 3) message += " and more.";
    }

    // 3. Schedule for today or tomorrow at the selected time
    final scheduledDate = _nextInstanceOfTime(time);

    // Replace old schedule with new one.
    await _notificationsPlugin.cancel(0);

    await _notificationsPlugin.zonedSchedule(
      0,
      'Pantry Alert',
      message,
      scheduledDate,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'expiry_alerts',
          'Expiry Alerts',
          channelDescription: 'Notifications for items expiring soon',
          importance: Importance.max,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time, // Repeat daily
    );
  }

  tz.TZDateTime _nextInstanceOfTime(TimeOfDay time) {
    final tz.TZDateTime now = tz.TZDateTime.now(tz.local);
    tz.TZDateTime scheduledDate = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      time.hour,
      time.minute,
    );

    // If picked time is already passed for today, schedule tomorrow.
    // Keep a small same-minute grace so users selecting "now" still get it.
    final sameHour = scheduledDate.hour == now.hour;
    final sameMinute = scheduledDate.minute == now.minute;
    if (scheduledDate.isBefore(now) && !(sameHour && sameMinute)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    } else if (sameHour && sameMinute && scheduledDate.isBefore(now)) {
      scheduledDate = now.add(const Duration(seconds: 5));
    }
    return scheduledDate;
  }

  Future<void> cancelDailyReminder() async {
    await _notificationsPlugin.cancel(0);
  }

  Future<void> showTestNotification() async {
    await _notificationsPlugin.show(
      999,
      'Test Notification',
      'This is a test notification from NoshNurture.',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'test_channel',
          'Test Notifications',
          importance: Importance.max,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  Future<void> refreshSchedule(List<InventoryItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    final bool dailyReminder = prefs.getBool('daily_reminder') ?? true;
    final bool enablePush = prefs.getBool('notif_push') ?? true;

    if (!dailyReminder || !enablePush) {
      await cancelDailyReminder();
      return;
    }

    final int hour = prefs.getInt('notif_hour') ?? 8;
    final int minute = prefs.getInt('notif_minute') ?? 0;
    final time = TimeOfDay(hour: hour, minute: minute);

    await scheduleDailyExpiryNotification(time: time, items: items);
  }
}
