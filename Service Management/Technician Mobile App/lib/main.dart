import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase failed to initialize (mock mode fallback): $e");
  }
  runApp(const TechnicianApp());
}

class TechnicianApp extends StatelessWidget {
  const TechnicianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GSP Tech App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          brightness: Brightness.dark,
          primary: Colors.teal,
          surface: const Color(0xFF1E2422),
        ),
        scaffoldBackgroundColor: const Color(0xFF101614),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

const String _apiUrl = 'https://app.globalservicepoint.com/api';

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  String? _token;
  Map<String, dynamic>? _userData;

  @override
  void initState() {
    super.initState();
    _requestNotificationPermissions();
    _checkLogin();
  }

  Future<void> _requestNotificationPermissions() async {
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (e) {
      debugPrint('Error requesting notification permissions: $e');
    }
  }

  Future<void> _checkLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userJson = prefs.getString('user');
    
    setState(() {
      _token = token;
      if (userJson != null) {
        _userData = jsonDecode(userJson);
      }
      _isLoading = false;
    });
    if (token != null) {
      _setupFcm();
    }
  }

  Future<void> _setupFcm() async {
    if (_token == null) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      
      String? fcmToken = await messaging.getToken();
      if (fcmToken != null) {
        await _registerFcmTokenWithBackend(fcmToken);
      }
      
      messaging.onTokenRefresh.listen((newToken) {
        _registerFcmTokenWithBackend(newToken);
      });

      void handleNotificationClick(RemoteMessage message) {
        final data = message.data;
        final screen = data['screen'];
        final ticketId = data['ticketId'] ?? data['jobId'];
        
        if (_token != null && mounted) {
          if (screen == 'job_details' && ticketId != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => JobDetailsScreen(
                  jobId: ticketId,
                  token: _token!,
                  apiUrl: _apiUrl,
                ),
              ),
            );
          } else if (screen == 'job_history') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => JobHistoryScreen(
                  token: _token!,
                  apiUrl: _apiUrl,
                ),
              ),
            );
          }
        }
      }

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '${message.notification?.title ?? "Notification"}: ${message.notification?.body ?? ""}'
              ),
              behavior: SnackBarBehavior.floating,
              action: SnackBarAction(
                label: 'View',
                onPressed: () => handleNotificationClick(message),
              ),
            ),
          );
        }
      });

      FirebaseMessaging.onMessageOpenedApp.listen(handleNotificationClick);

      messaging.getInitialMessage().then((RemoteMessage? message) {
        if (message != null) {
          handleNotificationClick(message);
        }
      });
    } catch (e) {
      debugPrint("FCM initialization warning (mock mode active): $e");
    }
  }

  Future<void> _registerFcmTokenWithBackend(String fcmToken) async {
    if (_token == null) return;
    try {
      final res = await http.post(
        Uri.parse('$_apiUrl/auth/fcm-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_token',
        },
        body: jsonEncode({'token': fcmToken}),
      );
      if (res.statusCode == 200) {
        debugPrint("FCM Token registered successfully with GSP backend.");
      } else {
        debugPrint("Failed to register FCM Token: ${res.body}");
      }
    } catch (e) {
      debugPrint("Error sending FCM Token to backend: $e");
    }
  }

  Future<void> _saveLogin(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', jsonEncode(user));
    setState(() {
      _token = token;
      _userData = user;
    });
    _setupFcm();
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    setState(() {
      _token = null;
      _userData = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (_token == null || _userData == null) {
      return LoginScreen(onLoginSuccess: _saveLogin);
    }
    
    return DashboardScreen(
      token: _token!,
      user: _userData!,
      apiUrl: _apiUrl,
      onLogout: _logout,
    );
  }
}

class LoginScreen extends StatefulWidget {
  final Function(String, Map<String, dynamic>) onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await http.post(
        Uri.parse('$_apiUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': _codeController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        if (data['role'] != 'technician') {
          throw Exception('Only technician credentials can sign in here.');
        }
        widget.onLoginSuccess(data['token'], data);
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Login failed. Please verify credentials.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error: Make sure database/backend is active at: $_apiUrl';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.handyman, size: 72, color: Colors.teal),
                const SizedBox(height: 16),
                const Text(
                  'GSP Field Force',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const Text(
                  'Technician Service App',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 32),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.2),
                      border: Border.all(color: Colors.red),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _codeController,
                  decoration: const InputDecoration(
                    labelText: 'Technician Code (e.g. TECH-1001)',
                    prefixIcon: Icon(Icons.badge),
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Enter tech code' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Enter password' : null,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                    : const Text('Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> user;
  final String apiUrl;
  final VoidCallback onLogout;

  const DashboardScreen({
    super.key,
    required this.token,
    required this.user,
    required this.apiUrl,
    required this.onLogout,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _assignedCount = 0;
  int _inProgressCount = 0;
  int _pendingCount = 0;
  int _completedCount = 0;
  double _earnings = 0.0;
  bool _isLoading = false;
  List _jobs = [];
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

  String _getMonthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  Future<void> _selectMonthYear(BuildContext context) async {
    int tempMonth = _selectedMonth;
    int tempYear = _selectedYear;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: const Text('Select Month & Year', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    value: tempMonth,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: const InputDecoration(
                      labelText: 'Month',
                      labelStyle: TextStyle(color: Colors.grey),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    items: const [
                      DropdownMenuItem(value: 1, child: Text('January')),
                      DropdownMenuItem(value: 2, child: Text('February')),
                      DropdownMenuItem(value: 3, child: Text('March')),
                      DropdownMenuItem(value: 4, child: Text('April')),
                      DropdownMenuItem(value: 5, child: Text('May')),
                      DropdownMenuItem(value: 6, child: Text('June')),
                      DropdownMenuItem(value: 7, child: Text('July')),
                      DropdownMenuItem(value: 8, child: Text('August')),
                      DropdownMenuItem(value: 9, child: Text('September')),
                      DropdownMenuItem(value: 10, child: Text('October')),
                      DropdownMenuItem(value: 11, child: Text('November')),
                      DropdownMenuItem(value: 12, child: Text('December')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => tempMonth = val);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    value: tempYear,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: const InputDecoration(
                      labelText: 'Year',
                      labelStyle: TextStyle(color: Colors.grey),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    items: [2024, 2025, 2026, 2027, 2028].map((y) {
                      return DropdownMenuItem(value: y, child: Text(y.toString()));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => tempYear = val);
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _selectedMonth = tempMonth;
                      _selectedYear = tempYear;
                    });
                    Navigator.pop(context);
                    _loadJobs();
                  },
                  child: const Text('Select', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => _isLoading = true);
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets?month=$_selectedMonth&year=$_selectedYear'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        final List jobsData = jsonDecode(res.body);
        int assigned = 0, inProgress = 0, pending = 0, completed = 0;
        double earnings = 0.0;
        for (var job in jobsData) {
          final s = job['status'];
          if (s == 'assigned') assigned++;
          if (s == 'in_progress') inProgress++;
          if (s == 'verification_pending') pending++;
          if (s == 'completed' || s == 'closed') {
            completed++;
            // Calculate Technician Earning: sum of Technician Fee for closed/completed tickets
            double techFee = 0.0;
            if (job['technicianEarning'] != null && job['technicianEarning'] is num) {
              techFee = (job['technicianEarning'] as num).toDouble();
            } else if (job['technicianFee'] != null && job['technicianFee'] is num) {
              techFee = (job['technicianFee'] as num).toDouble();
            } else {
              final type = job['type'] ?? '';
              if (type == 'service') {
                techFee = (job['technicianServiceFee'] ?? job['serviceFee'] ?? 0).toDouble();
              } else if (type == 'installation') {
                techFee = (job['technicianInstallationFee'] ?? job['installationFee'] ?? 0).toDouble();
              }
            }
            earnings += techFee;
          }
        }
        setState(() {
          _jobs = jobsData;
          _assignedCount = assigned;
          _inProgressCount = inProgress;
          _pendingCount = pending;
          _completedCount = completed;
          _earnings = earnings;
        });
      }
    } catch (e) {
      print('Error fetching jobs: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeJobs = _jobs.where((j) => j['status'] == 'assigned' || j['status'] == 'in_progress').toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.user['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Tech Code: ${widget.user['code']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJobs,
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ProfileScreen(
                    user: widget.user,
                    role: 'Technician Partner',
                    onLogout: widget.onLogout,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadJobs,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Job Metrics',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  GestureDetector(
                    onTap: () => _selectMonthYear(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E2422),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.teal.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, color: Colors.teal, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            '${_getMonthName(_selectedMonth)} $_selectedYear',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _isLoading 
                ? const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
                : Column(
                      children: [
                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 1.5,
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            _buildStatCard(
                              'Assigned',
                              _assignedCount,
                              Colors.amber,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => JobHistoryScreen(
                                    token: widget.token,
                                    apiUrl: widget.apiUrl,
                                    initialStatus: 'assigned',
                                    initialMonth: _selectedMonth,
                                    initialYear: _selectedYear,
                                  ),
                                ),
                              ).then((_) => _loadJobs()),
                            ),
                            _buildStatCard(
                              'In Progress',
                              _inProgressCount,
                              Colors.cyan,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => JobHistoryScreen(
                                    token: widget.token,
                                    apiUrl: widget.apiUrl,
                                    initialStatus: 'in_progress',
                                    initialMonth: _selectedMonth,
                                    initialYear: _selectedYear,
                                  ),
                                ),
                              ).then((_) => _loadJobs()),
                            ),
                            _buildStatCard(
                              'Pending Verification',
                              _pendingCount,
                              Colors.orange,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => JobHistoryScreen(
                                    token: widget.token,
                                    apiUrl: widget.apiUrl,
                                    initialStatus: 'verification_pending',
                                    initialMonth: _selectedMonth,
                                    initialYear: _selectedYear,
                                  ),
                                ),
                              ).then((_) => _loadJobs()),
                            ),
                            _buildStatCard(
                              'Closed',
                              _completedCount,
                              Colors.green,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => JobHistoryScreen(
                                    token: widget.token,
                                    apiUrl: widget.apiUrl,
                                    initialStatus: 'closed',
                                    initialMonth: _selectedMonth,
                                    initialYear: _selectedYear,
                                  ),
                                ),
                              ).then((_) => _loadJobs()),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Card(
                          margin: EdgeInsets.zero,
                          color: const Color(0xFF1E2422),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.teal.withOpacity(0.3)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Earnings',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.tealAccent),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'For the month of ${_getMonthName(_selectedMonth)}',
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                Text(
                                  '₹ ${_earnings.toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
              const SizedBox(height: 32),
              const Text(
                'Active Service Tickets',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              activeJobs.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E2422),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      'No active assigned jobs. Refresh to check again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: activeJobs.length,
                    itemBuilder: (context, index) {
                      final job = activeJobs[index];
                      return _buildJobTile(job);
                    },
                  ),
              const SizedBox(height: 24),
              _buildHistoryButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int count, Color color, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          border: Border.all(color: color.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            Text('$count', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildJobTile(Map<String, dynamic> job) {
    final status = job['status'];
    final number = job['ticketNumber'] ?? 'TKT-????';
    final name = job['customer']['name'] ?? 'N/A';
    final address = job['customer']['address'] ?? 'N/A';
    final city = job['customer']['city'] ?? 'N/A';
    final type = job['type'] ?? 'service';
    final product = job['product']['name'] ?? 'N/A';
    final priority = (job['installationDetails']?['priority'] ?? job['serviceDetails']?['priority'] ?? 'medium').toString().toLowerCase();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF1E2422),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.teal.withOpacity(0.15)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(number, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Row(
              children: [
                Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: (priority == 'high'
                        ? Colors.red
                        : priority == 'low'
                            ? Colors.blueGrey
                            : Colors.amber).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: (priority == 'high'
                          ? Colors.redAccent
                          : priority == 'low'
                              ? Colors.grey
                              : Colors.amberAccent).withOpacity(0.5),
                    ),
                  ),
                  child: Text(
                    priority == 'medium' ? 'MID PRIORITY' : '${priority.toUpperCase()} PRIORITY',
                    style: TextStyle(
                      color: priority == 'high'
                          ? Colors.redAccent
                          : priority == 'low'
                              ? Colors.grey[300]
                              : Colors.amberAccent,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (job['adminVerification'] != null && job['adminVerification']['status'] == 'rejected')
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: const Text(
                      'REASSIGNED',
                      style: TextStyle(color: Colors.redAccent, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (status == 'assigned' ? Colors.amber : Colors.orange).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status.toString().toUpperCase(),
                    style: TextStyle(color: status == 'assigned' ? Colors.amber : Colors.orange, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text('Client: $name', style: const TextStyle(color: Colors.white, fontSize: 14)),
            const SizedBox(height: 4),
            Text('Address: $address, $city', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 4),
            Text('Device: $product ($type)', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => JobDetailsScreen(
                jobId: job['_id'],
                token: widget.token,
                apiUrl: widget.apiUrl,
                initialJob: job,
              ),
            ),
          ).then((_) => _loadJobs());
        },
      ),
    );
  }

  Widget _buildHistoryButton() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketFormScreen(
                      type: 'installation',
                      token: widget.token,
                      apiUrl: widget.apiUrl,
                    ),
                  ),
                ).then((_) => _loadJobs()),
                icon: const Icon(Icons.build_circle, color: Colors.tealAccent),
                label: const Text('Raise Installation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2422),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.teal.withOpacity(0.3)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketFormScreen(
                      type: 'service',
                      token: widget.token,
                      apiUrl: widget.apiUrl,
                    ),
                  ),
                ).then((_) => _loadJobs()),
                icon: const Icon(Icons.home_repair_service, color: Colors.orangeAccent),
                label: const Text('Raise Service', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2422),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: Colors.orange.withOpacity(0.3)),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => JobHistoryScreen(
                token: widget.token,
                apiUrl: widget.apiUrl,
                initialMonth: _selectedMonth,
                initialYear: _selectedYear,
              ),
            ),
          ),
          icon: const Icon(Icons.history),
          label: const Text('View Job History'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueGrey[850],
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(48),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }
}

class JobDetailsScreen extends StatefulWidget {
  final String jobId;
  final String token;
  final String apiUrl;
  final Map<String, dynamic>? initialJob;

  const JobDetailsScreen({
    super.key,
    required this.jobId,
    required this.token,
    required this.apiUrl,
    this.initialJob,
  });

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  Map<String, dynamic>? _job;
  bool _isLoading = false;
  bool _isFeeLoading = true;
  final _workDoneController = TextEditingController();
  final _remarksController = TextEditingController();
  final List<File> _beforePhotos = [];
  final List<File> _afterPhotos = [];
  final _picker = ImagePicker();
  List<dynamic> _inventory = [];
  final List<Map<String, dynamic>> _selectedParts = [];

  String _formatDateTime(String? dtStr) {
    if (dtStr == null || dtStr.isEmpty) return 'Flexible';
    try {
      final parsed = DateTime.parse(dtStr).toLocal();
      final y = parsed.year;
      final m = parsed.month.toString().padLeft(2, '0');
      final d = parsed.day.toString().padLeft(2, '0');
      final hr = parsed.hour.toString().padLeft(2, '0');
      final min = parsed.minute.toString().padLeft(2, '0');
      return '$y-$m-$d $hr:$min';
    } catch (_) {
      return dtStr;
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialJob != null) {
      _job = widget.initialJob;
      final hasFees = _job?['customerServiceFee'] != null || 
                      _job?['customerInstallationFee'] != null || 
                      _job?['dealerServiceFee'] != null || 
                      _job?['dealerInstallationFee'] != null ||
                      _job?['customerFee'] != null;
      _isFeeLoading = !hasFees;
    } else {
      _isFeeLoading = true;
    }
    _loadJob();
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/inventory'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        setState(() {
          _inventory = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error fetching inventory: $e');
    }
  }

  void _showAddPartDialog() {
    if (_inventory.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No inventory items loaded')),
      );
      return;
    }

    dynamic selectedItem = _inventory[0];
    final qtyController = TextEditingController(text: '1');

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Part Used'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<dynamic>(
                    value: selectedItem,
                    isExpanded: true,
                    items: _inventory.map((item) {
                      final price = (item['sellingPrice'] is num) ? (item['sellingPrice'] as num).toInt() : 0;
                      return DropdownMenuItem<dynamic>(
                        value: item,
                        child: Text('${item['name']} (₹$price) - Avail: ${item['quantity']}'),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setDialogState(() {
                        selectedItem = val;
                      });
                    },
                    decoration: const InputDecoration(labelText: 'Select Part'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: qtyController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final qty = int.tryParse(qtyController.text);
                    if (qty == null || qty <= 0) return;
                    if (qty > (selectedItem['quantity'] ?? 0)) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Insufficient stock. Available: ${selectedItem['quantity']}')),
                      );
                      return;
                    }
                    
                    final sellingPrice = (selectedItem['sellingPrice'] is num)
                        ? (selectedItem['sellingPrice'] as num).toDouble()
                        : 0.0;

                    setState(() {
                      _selectedParts.add({
                        'part': selectedItem['_id'],
                        'quantity': qty,
                        'name': selectedItem['name'],
                        'sku': selectedItem['sku'],
                        'sellingPrice': sellingPrice,
                      });
                    });
                    Navigator.pop(context);
                  },
                  child: const Text('Add'),
                )
              ],
            );
          }
        );
      }
    );
  }

  Future<void> _loadJob() async {
    if (_job == null) {
      setState(() => _isLoading = true);
    }
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets/${widget.jobId}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _job = jsonDecode(res.body);
            _isFeeLoading = false;
          });
        }
      }
    } catch (e) {
      print('Error loading job details: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isFeeLoading = false;
          if (_isLoading) _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateStatus(String nextStatus, String timelineNote) async {
    setState(() => _isLoading = true);
    try {
      final res = await http.patch(
        Uri.parse('${widget.apiUrl}/tickets/${widget.jobId}/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
        body: jsonEncode({
          'status': nextStatus,
          'note': timelineNote,
        }),
      );
      if (res.statusCode == 200) {
        setState(() {
          _job = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Status change error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickBeforeImage() async {
    if (_beforePhotos.length >= 2) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 2 Before photos allowed')));
      return;
    }
    final pickedFile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 80,
    );
    if (pickedFile != null) {
      setState(() {
        _beforePhotos.add(File(pickedFile.path));
      });
    }
  }

  Future<void> _pickAfterImage() async {
    if (_afterPhotos.length >= 4) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 4 After photos allowed')));
      return;
    }
    final pickedFile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 80,
    );
    if (pickedFile != null) {
      setState(() {
        _afterPhotos.add(File(pickedFile.path));
      });
    }
  }

  Future<void> _submitCompletion() async {
    if (_workDoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please specify work done details')));
      return;
    }

    if (_beforePhotos.isEmpty && _afterPhotos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload at least one Before or After photo'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final url = Uri.parse('${widget.apiUrl}/tickets/${widget.jobId}/complete');
      final request = http.MultipartRequest('PATCH', url);
      request.headers['Authorization'] = 'Bearer ${widget.token}';
      
      request.fields['workDone'] = _workDoneController.text.trim();
      request.fields['remarks'] = _remarksController.text.trim();
      request.fields['usedParts'] = jsonEncode(_selectedParts.map((p) => {
        'part': p['part'],
        'quantity': p['quantity']
      }).toList());

      for (var file in _beforePhotos) {
        request.files.add(await http.MultipartFile.fromPath('beforePhotos', file.path));
      }

      for (var file in _afterPhotos) {
        request.files.add(await http.MultipartFile.fromPath('afterPhotos', file.path));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Work completion submitted for approval!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        String errorMessage = 'Failed to submit job completion';
        try {
          final errorData = jsonDecode(response.body);
          if (errorData != null && errorData['message'] != null) {
            errorMessage = errorData['message'];
          }
        } catch (_) {}
        throw Exception(errorMessage);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_job == null) return const Scaffold(body: Center(child: Text('Job not found')));

    final status = _job!['status'];

    return Scaffold(
      appBar: AppBar(title: Text(_job!['ticketNumber'] ?? 'Job Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_job!['adminVerification'] != null && _job!['adminVerification']['status'] == 'rejected') ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.warning_amber_rounded, color: Colors.redAccent),
                        SizedBox(width: 8),
                        Text(
                          'REASSIGNED / REJECTED',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.redAccent),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'This ticket was previously submitted but rejected by the Admin.',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Admin Comments / Reason:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.red[200]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _job!['adminVerification']['reason'] ?? 'No reason provided',
                      style: const TextStyle(fontSize: 13, color: Colors.white, fontStyle: FontStyle.italic),
                    ),
                    ...(() {
                      final history = (_job!['completionHistory'] as List?) ?? [];
                      final completionsList = history.isNotEmpty
                          ? history
                          : (_job!['completion'] != null ? [_job!['completion']] : []);

                      if (completionsList.isEmpty) return <Widget>[];

                      return [
                        const SizedBox(height: 12),
                        Text(
                          'Previous Completion Submission Photos:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.red[200]),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: List.generate(completionsList.length, (attemptIndex) {
                            final comp = completionsList[attemptIndex];
                            final beforePhotos = comp['beforePhotos'] as List?;
                            final afterPhotos = comp['afterPhotos'] as List?;
                            final compPhotos = comp['photos'] as List?;

                            if ((beforePhotos != null && beforePhotos.isNotEmpty) || (afterPhotos != null && afterPhotos.isNotEmpty)) {
                              return Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (beforePhotos != null && beforePhotos.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(right: 6.0),
                                      child: ElevatedButton.icon(
                                        onPressed: () => _viewPhotos(
                                          context,
                                          beforePhotos,
                                          title: 'Before Photos (Attempt ${attemptIndex + 1})',
                                        ),
                                        icon: const Icon(Icons.camera_alt, size: 13, color: Colors.amberAccent),
                                        label: Text('Before (${beforePhotos.length})', style: const TextStyle(fontSize: 11)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.amber[900]!.withOpacity(0.4),
                                          foregroundColor: Colors.amber[200],
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                    ),
                                  if (afterPhotos != null && afterPhotos.isNotEmpty)
                                    ElevatedButton.icon(
                                      onPressed: () => _viewPhotos(
                                        context,
                                        afterPhotos,
                                        title: 'After Photos (Attempt ${attemptIndex + 1})',
                                      ),
                                      icon: const Icon(Icons.check_circle, size: 13, color: Colors.greenAccent),
                                      label: Text('After (${afterPhotos.length})', style: const TextStyle(fontSize: 11)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.teal[900],
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                ],
                              );
                            }

                            if (compPhotos == null || compPhotos.isEmpty) return const SizedBox.shrink();
                            return ElevatedButton.icon(
                              onPressed: () => _viewPhotos(
                                context,
                                compPhotos,
                                title: 'Photos (Attempt ${attemptIndex + 1})',
                              ),
                              icon: const Icon(Icons.photo_library, size: 14),
                              label: Text('Photos (Attempt ${attemptIndex + 1})'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.teal[900],
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            );
                          }),
                        ),
                      ];
                    })(),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            _buildDetailBlock('Customer Details', [
              'Name: ${_job!['customer']['name']}',
              'Mobile: ${_job!['customer']['mobile']}',
              'Alt Mobile: ${_job!['customer']['alternateMobile'] ?? 'N/A'}',
              'Address: ${_job!['customer']['address']}',
              'City: ${_job!['customer']['city']} - ${_job!['customer']['pincode']}',
            ]),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () async {
                final mobile = _job!['customer']['mobile']?.toString() ?? '';
                if (mobile.isNotEmpty) {
                  final Uri launchUri = Uri(
                    scheme: 'tel',
                    path: mobile,
                  );
                  try {
                    if (!await launchUrl(launchUri)) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Could not launch dialer for $mobile')),
                      );
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error launching phone app: $e')),
                    );
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('No mobile number available')),
                  );
                }
              },
              icon: const Icon(Icons.phone),
              label: const Text('Call Customer'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal[900],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailBlock('Product Details', [
              'Category: ${_job!['product']['category']}',
              'Name: ${_job!['product']['name']}',
              'Model: ${_job!['product']['modelNumber'] ?? 'N/A'}',
              'Serial: ${_job!['product']['serialNumber'] ?? 'N/A'}',
              'Scope: ${_job!['type'].toString().toUpperCase()}',
              'Type: ${_job!['type'].toString().toLowerCase() == 'service' ? (_job!['serviceType'] ?? _job!['serviceDetails']?['serviceType'] ?? 'In Warranty') : (_job!['installationType'] ?? _job!['installationDetails']?['installationType'] ?? 'Free Installation')}',
              'Priority: ${((_job!['installationDetails']?['priority'] ?? _job!['serviceDetails']?['priority'] ?? 'medium').toString()).toLowerCase() == 'medium' ? 'MID' : ((_job!['installationDetails']?['priority'] ?? _job!['serviceDetails']?['priority'] ?? 'medium').toString()).toUpperCase()}',
              if (_job!['serviceDetails']?['description'] != null)
                'Issue: ${_job!['serviceDetails']['description']}',
            ]),
            const SizedBox(height: 16),
            _buildDetailBlock('Scheduling Details', [
              'Preferred Visit Date & Time: ${_job!['preferredVisitDate'] != null ? _formatDateTime(_job!['preferredVisitDate'].toString()) : (_job!['installationDetails']?['preferredDate'] != null ? _formatDateTime(_job!['installationDetails']['preferredDate'].toString()) : 'Flexible')}',
            ]),
            const SizedBox(height: 16),
            _buildStatusFlow(status),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailBlock(String title, List<String> details) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E2422),
        border: Border.all(color: Colors.teal.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.tealAccent)),
          const SizedBox(height: 12),
          ...details.map((d) => Padding(
            padding: const EdgeInsets.only(bottom: 6.0),
            child: Text(d, style: const TextStyle(fontSize: 13, color: Colors.white70)),
          )),
        ],
      ),
    );
  }

  Widget _buildStatusFlow(String status) {
    if (status == 'assigned') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton(
            onPressed: () => _updateStatus('in_progress', 'Technician accepted job and is travelling to customer venue'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
            child: const Text('Accept & Start Travelling'),
          ),
        ],
      );
    }
    
    if (status == 'in_progress') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E2422),
          border: Border.all(color: Colors.orange.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Job Work Progress', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.orangeAccent)),
            const SizedBox(height: 12),
            TextFormField(
              controller: _workDoneController,
              decoration: const InputDecoration(
                labelText: 'Work Done Description',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _remarksController,
              decoration: const InputDecoration(
                labelText: 'Technician Remarks (Optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            // BEFORE PHOTOS SECTION (MAX 2)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.camera_alt, size: 14, color: Colors.amberAccent),
                    const SizedBox(width: 6),
                    Text(
                      'Before Photos (${_beforePhotos.length}/2)',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.amberAccent),
                    ),
                  ],
                ),
                if (_beforePhotos.length < 2)
                  TextButton.icon(
                    onPressed: _pickBeforeImage,
                    icon: const Icon(Icons.add_a_photo, size: 14, color: Colors.amberAccent),
                    label: const Text('Add (Max 2)', style: TextStyle(fontSize: 12, color: Colors.amberAccent)),
                  ),
              ],
            ),
            if (_beforePhotos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _beforePhotos.map((f) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(f, height: 70, width: 70, fit: BoxFit.cover),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: GestureDetector(
                        onTap: () => setState(() => _beforePhotos.remove(f)),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 12, color: Colors.red),
                        ),
                      ),
                    )
                  ],
                )).toList(),
              ),
            ],
            const SizedBox(height: 16),

            // AFTER PHOTOS SECTION (MAX 4)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle, size: 14, color: Colors.greenAccent),
                    const SizedBox(width: 6),
                    Text(
                      'After Photos (${_afterPhotos.length}/4)',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.greenAccent),
                    ),
                  ],
                ),
                if (_afterPhotos.length < 4)
                  TextButton.icon(
                    onPressed: _pickAfterImage,
                    icon: const Icon(Icons.add_a_photo, size: 14, color: Colors.greenAccent),
                    label: const Text('Add (Max 4)', style: TextStyle(fontSize: 12, color: Colors.greenAccent)),
                  ),
              ],
            ),
            if (_afterPhotos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _afterPhotos.map((f) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(f, height: 70, width: 70, fit: BoxFit.cover),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: GestureDetector(
                        onTap: () => setState(() => _afterPhotos.remove(f)),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 12, color: Colors.red),
                        ),
                      ),
                    )
                  ],
                )).toList(),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Parts Used', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[300])),
                TextButton.icon(
                  onPressed: _showAddPartDialog,
                  icon: const Icon(Icons.add, size: 16, color: Colors.orangeAccent),
                  label: const Text('Add Part', style: TextStyle(fontSize: 12, color: Colors.orangeAccent)),
                )
              ],
            ),
            if (_selectedParts.isNotEmpty) ...[
              const SizedBox(height: 4),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _selectedParts.length,
                itemBuilder: (context, idx) {
                  final p = _selectedParts[idx];
                  final qty = (p['quantity'] is num) ? (p['quantity'] as num).toInt() : 1;
                  final price = (p['sellingPrice'] is num) ? (p['sellingPrice'] as num).toDouble() : 0.0;
                  final partItemTotal = price * qty;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF151917),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                              const SizedBox(height: 2),
                              Text('SKU: ${p['sku']} • Qty: $qty × ₹${price.toInt()}', style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                            ],
                          ),
                        ),
                        Text('₹ ${partItemTotal.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.tealAccent)),
                        const SizedBox(width: 4),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => setState(() => _selectedParts.removeAt(idx)),
                        ),
                      ],
                    ),
                  );
                },
              )
            ] else ...[
              Text('No spare parts added.', style: TextStyle(color: Colors.grey[500], fontSize: 12, fontStyle: FontStyle.italic)),
            ],

            const SizedBox(height: 20),
            _buildPaymentSummaryCard(),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitCompletion,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Submit Completion Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF151917),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Status: ${status.replaceAll('_', ' ').toUpperCase()}\nWaiting for Admin verification/closure.',
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSummaryCard() {
    if (_isFeeLoading || _job == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: const Color(0xFF141F1D),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.teal.withValues(alpha: 0.3)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: Colors.tealAccent,
              ),
            ),
            SizedBox(width: 14),
            Text(
              'Loading billing & fee summary...',
              style: TextStyle(
                color: Colors.tealAccent,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    final type = (_job!['type'] ?? '').toString().toLowerCase();
    final sType = (_job!['serviceType'] ?? _job!['serviceDetails']?['serviceType'] ?? 'In Warranty').toString();
    final iType = (_job!['installationType'] ?? _job!['installationDetails']?['installationType'] ?? 'Free Installation').toString();

    final custServiceFee = ((_job!['customerServiceFee'] ?? _job!['serviceFee'] ?? 0) is num)
        ? (_job!['customerServiceFee'] ?? _job!['serviceFee'] ?? 0).toDouble()
        : 0.0;
    final custInstallFee = ((_job!['customerInstallationFee'] ?? _job!['installationFee'] ?? 0) is num)
        ? (_job!['customerInstallationFee'] ?? _job!['installationFee'] ?? 0).toDouble()
        : 0.0;

    final dlrServiceFee = ((_job!['dealerServiceFee'] ?? _job!['serviceFee'] ?? 0) is num)
        ? (_job!['dealerServiceFee'] ?? _job!['serviceFee'] ?? 0).toDouble()
        : 0.0;
    final dlrInstallFee = ((_job!['dealerInstallationFee'] ?? _job!['installationFee'] ?? 0) is num)
        ? (_job!['dealerInstallationFee'] ?? _job!['installationFee'] ?? 0).toDouble()
        : 0.0;

    final isCustomerPaying = (type == 'service' && sType == 'Out Warranty') || (type == 'installation' && iType == 'Paid Installation');
    final isDealerPaying = (type == 'service' && sType == 'Paid by Dealer') || (type == 'installation' && iType == 'Paid by Dealer');

    double baseFee = 0.0;
    String feeLabel = '';
    if (isCustomerPaying) {
      if (type == 'service') {
        baseFee = custServiceFee;
        feeLabel = 'Customer Service Fee (Out Warranty)';
      } else {
        baseFee = custInstallFee;
        feeLabel = 'Customer Installation Fee (Paid Installation)';
      }
    } else if (isDealerPaying) {
      if (type == 'service') {
        baseFee = dlrServiceFee;
        feeLabel = 'Dealer Service Fee (Paid by Dealer)';
      } else {
        baseFee = dlrInstallFee;
        feeLabel = 'Dealer Installation Fee (Paid by Dealer)';
      }
    } else {
      feeLabel = type == 'service' ? 'Service Fee (In Warranty)' : 'Installation Fee (Free Installation)';
    }

    double partsTotal = 0.0;
    for (var p in _selectedParts) {
      final qty = (p['quantity'] is num) ? (p['quantity'] as num).toInt() : 1;
      final price = (p['sellingPrice'] is num) ? (p['sellingPrice'] as num).toDouble() : 0.0;
      partsTotal += price * qty;
    }

    final grandTotal = baseFee + partsTotal;

    Color cardBorderColor = Colors.teal.withValues(alpha: 0.3);
    Color headerBadgeBg = Colors.teal.withValues(alpha: 0.2);
    Color headerBadgeTextColor = Colors.tealAccent;
    String headerTitle = 'PAYMENT / BILLING SUMMARY';
    String payerBadge = isCustomerPaying ? 'CUSTOMER PAYS' : (isDealerPaying ? 'PAID BY DEALER' : 'FREE / WARRANTY');

    if (isCustomerPaying) {
      cardBorderColor = Colors.greenAccent.withValues(alpha: 0.4);
      headerBadgeBg = Colors.green.withValues(alpha: 0.2);
      headerBadgeTextColor = Colors.greenAccent;
      headerTitle = '💳 COLLECT FROM CUSTOMER';
    } else if (isDealerPaying) {
      cardBorderColor = Colors.purpleAccent.withValues(alpha: 0.4);
      headerBadgeBg = Colors.purple.withValues(alpha: 0.2);
      headerBadgeTextColor = Colors.purpleAccent;
      headerTitle = '🏢 BILLED TO DEALER';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161C19),
        border: Border.all(color: cardBorderColor, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                headerTitle,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: headerBadgeTextColor),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: headerBadgeBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  payerBadge,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: headerBadgeTextColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  feeLabel,
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ),
              Text(
                '₹ ${baseFee.toInt()}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Parts Total (${_selectedParts.length} item${_selectedParts.length == 1 ? '' : 's'})',
                style: const TextStyle(fontSize: 12, color: Colors.white70),
              ),
              Text(
                '₹ ${partsTotal.toInt()}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ],
          ),
          const Divider(color: Colors.white24, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCustomerPaying ? 'TOTAL TO COLLECT' : (isDealerPaying ? 'TOTAL BILLED TO DEALER' : 'TOTAL AMOUNT'),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                  if (isCustomerPaying)
                    const Text('Collect this total from customer on-site', style: TextStyle(fontSize: 10, color: Colors.greenAccent))
                  else if (isDealerPaying)
                    const Text('Customer does not pay. Billed to dealer.', style: TextStyle(fontSize: 10, color: Colors.purpleAccent))
                  else
                    const Text('No fee required for customer', style: TextStyle(fontSize: 10, color: Colors.white38)),
                ],
              ),
              Text(
                '₹ ${grandTotal.toInt()}',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isCustomerPaying ? Colors.greenAccent : (isDealerPaying ? Colors.purpleAccent : Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _viewPhotos(BuildContext context, List photos, {String title = 'Completion Photos'}) {
    showDialog(
      context: context,
      builder: (context) {
        final base = widget.apiUrl.replaceAll('/api', '');
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: photos.isEmpty
              ? const Text('No photos uploaded.', style: TextStyle(color: Colors.grey))
              : SizedBox(
                  width: double.maxFinite,
                  height: 300,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: photos.length,
                    itemBuilder: (context, index) {
                      final url = '$base/${photos[index]}';
                      return Padding(
                        padding: const EdgeInsets.only(right: 12.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            url,
                            fit: BoxFit.cover,
                            width: 250,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: 250,
                                color: Colors.grey[850],
                                child: const Icon(Icons.broken_image, color: Colors.grey),
                              );
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close', style: TextStyle(color: Colors.blue)),
            ),
          ],
        );
      },
    );
  }
}

class JobHistoryScreen extends StatefulWidget {
  final String token;
  final String apiUrl;
  final String? initialStatus;
  final int? initialMonth;
  final int? initialYear;

  const JobHistoryScreen({super.key, required this.token, required this.apiUrl, this.initialStatus, this.initialMonth, this.initialYear});

  @override
  State<JobHistoryScreen> createState() => _JobHistoryScreenState();
}

class _JobHistoryScreenState extends State<JobHistoryScreen> {
  List _jobs = [];
  bool _isLoading = false;
  bool _isMoreLoading = false;
  int _currentPage = 1;
  bool _hasMore = false;

  late int _selectedMonth;
  late int _selectedYear;
  late String _selectedStatusFilter;

  @override
  void initState() {
    super.initState();
    _selectedMonth = widget.initialMonth ?? DateTime.now().month;
    _selectedYear = widget.initialYear ?? DateTime.now().year;
    _selectedStatusFilter = widget.initialStatus ?? 'closed';
    _fetchJobs();
  }

  Future<void> _fetchJobs({bool isLoadMore = false}) async {
    if (isLoadMore) {
      setState(() => _isMoreLoading = true);
    } else {
      setState(() {
        _isLoading = true;
        _jobs = [];
        _currentPage = 1;
        _hasMore = false;
      });
    }

    try {
      final queryParams = 'month=$_selectedMonth&year=$_selectedYear&status=$_selectedStatusFilter&page=$_currentPage&limit=10';
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets?$queryParams'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        final List data = body['data'] ?? [];
        setState(() {
          if (isLoadMore) {
            _jobs.addAll(data);
          } else {
            _jobs = data;
          }
          _hasMore = body['hasMore'] ?? false;
        });
      }
    } catch (e) {
      print('Error fetching jobs: $e');
    } finally {
      setState(() {
        _isLoading = false;
        _isMoreLoading = false;
      });
    }
  }

  void _onLoadMore() {
    if (_hasMore && !_isMoreLoading) {
      _currentPage++;
      _fetchJobs(isLoadMore: true);
    }
  }

  String _getMonthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }

  String _getAssignedDate(Map<String, dynamic> job) {
    if (job['timeline'] != null && job['timeline'] is List) {
      for (var entry in job['timeline']) {
        if (entry['status'] == 'assigned' && entry['timestamp'] != null) {
          final date = DateTime.tryParse(entry['timestamp'])?.toLocal();
          if (date != null) {
            return "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
          }
        }
      }
    }
    if (job['createdAt'] != null) {
      final date = DateTime.tryParse(job['createdAt'])?.toLocal();
      if (date != null) {
        return "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
      }
    }
    return 'N/A';
  }

  Future<void> _selectMonthYear(BuildContext context) async {
    int tempMonth = _selectedMonth;
    int tempYear = _selectedYear;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: const Text('Select Month & Year', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    value: tempMonth,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: const InputDecoration(
                      labelText: 'Month',
                      labelStyle: TextStyle(color: Colors.grey),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    items: const [
                      DropdownMenuItem(value: 1, child: Text('January')),
                      DropdownMenuItem(value: 2, child: Text('February')),
                      DropdownMenuItem(value: 3, child: Text('March')),
                      DropdownMenuItem(value: 4, child: Text('April')),
                      DropdownMenuItem(value: 5, child: Text('May')),
                      DropdownMenuItem(value: 6, child: Text('June')),
                      DropdownMenuItem(value: 7, child: Text('July')),
                      DropdownMenuItem(value: 8, child: Text('August')),
                      DropdownMenuItem(value: 9, child: Text('September')),
                      DropdownMenuItem(value: 10, child: Text('October')),
                      DropdownMenuItem(value: 11, child: Text('November')),
                      DropdownMenuItem(value: 12, child: Text('December')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => tempMonth = val);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    value: tempYear,
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: const InputDecoration(
                      labelText: 'Year',
                      labelStyle: TextStyle(color: Colors.grey),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    items: [2024, 2025, 2026, 2027, 2028].map((y) {
                      return DropdownMenuItem(value: y, child: Text(y.toString()));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => tempYear = val);
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _selectedMonth = tempMonth;
                      _selectedYear = tempYear;
                    });
                    Navigator.pop(context);
                    _fetchJobs();
                  },
                  child: const Text('Select', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _viewPhotos(BuildContext context, List photos, {String title = 'Completion Photos'}) {
    showDialog(
      context: context,
      builder: (context) {
        final base = widget.apiUrl.replaceAll('/api', '');
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          content: photos.isEmpty
              ? const Text('No photos uploaded.', style: TextStyle(color: Colors.grey))
              : SizedBox(
                  width: double.maxFinite,
                  height: 300,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: photos.length,
                    itemBuilder: (context, index) {
                      final url = '$base/${photos[index]}';
                      return Padding(
                        padding: const EdgeInsets.only(right: 12.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            url,
                            fit: BoxFit.cover,
                            width: 250,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: 250,
                                color: Colors.grey[850],
                                child: const Icon(Icons.broken_image, color: Colors.grey),
                              );
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Job History')),
      body: Column(
        children: [
          // Month & Year Selector Card
          GestureDetector(
            onTap: () => _selectMonthYear(context),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E2422),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.teal.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Colors.teal, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        '${_getMonthName(_selectedMonth)} $_selectedYear',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  const Icon(Icons.arrow_drop_down, color: Colors.white),
                ],
              ),
            ),
          ),
          // Status choice chips row
          Container(
            height: 48,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: const Text('Assigned'),
                    selected: _selectedStatusFilter == 'assigned',
                    onSelected: (sel) {
                      if (sel) {
                        setState(() {
                          _selectedStatusFilter = 'assigned';
                        });
                        _fetchJobs();
                      }
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: const Text('In Progress'),
                    selected: _selectedStatusFilter == 'in_progress',
                    onSelected: (sel) {
                      if (sel) {
                        setState(() {
                          _selectedStatusFilter = 'in_progress';
                        });
                        _fetchJobs();
                      }
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: const Text('Pending Verification'),
                    selected: _selectedStatusFilter == 'verification_pending',
                    onSelected: (sel) {
                      if (sel) {
                        setState(() {
                          _selectedStatusFilter = 'verification_pending';
                        });
                        _fetchJobs();
                      }
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: const Text('Closed'),
                    selected: _selectedStatusFilter == 'closed',
                    onSelected: (sel) {
                      if (sel) {
                        setState(() {
                          _selectedStatusFilter = 'closed';
                        });
                        _fetchJobs();
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _jobs.isEmpty
                ? const Center(child: Text('No matching jobs found', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _jobs.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _jobs.length) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16.0),
                          child: Center(
                            child: _isMoreLoading
                              ? const CircularProgressIndicator()
                              : ElevatedButton(
                                  onPressed: _onLoadMore,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF004D40), // Teal dark
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Load More'),
                                ),
                          ),
                        );
                      }
                      final job = _jobs[index];
                      final customerName = job['customer']['name'] ?? 'N/A';
                      final applianceName = job['product']['name'] ?? 'N/A';
                      final brand = job['product']['category'] ?? 'N/A';
                      final scope = job['type']?.toString().toUpperCase() ?? 'SERVICE';
                      final assignedDateStr = _getAssignedDate(job);
                      final List? completionHistory = job['completionHistory'] as List?;
                      final hasHistory = completionHistory != null && completionHistory.isNotEmpty;
                      final photos = job['completion']?['photos'] as List?;
                      final hasPhotos = photos != null && photos.isNotEmpty;

                      return Card(
                        color: const Color(0xFF1E2422),
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: Colors.teal.withOpacity(0.15)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    job['ticketNumber'] ?? 'TKT-????',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.teal),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.teal.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      job['status'].toString().toUpperCase(),
                                      style: const TextStyle(color: Colors.teal, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text('Customer: $customerName', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                              const SizedBox(height: 4),
                              Text('Appliance: $applianceName ($brand)', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              const SizedBox(height: 4),
                              Text('Type: $scope', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              const SizedBox(height: 4),
                              Text('Assigned: $assignedDateStr', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              if (hasHistory) ...[
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: List.generate(completionHistory.length, (attemptIndex) {
                                    final comp = completionHistory[attemptIndex];
                                    final beforePhotos = comp['beforePhotos'] as List?;
                                    final afterPhotos = comp['afterPhotos'] as List?;
                                    final compPhotos = comp['photos'] as List?;

                                    if ((beforePhotos != null && beforePhotos.isNotEmpty) || (afterPhotos != null && afterPhotos.isNotEmpty)) {
                                      return Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (beforePhotos != null && beforePhotos.isNotEmpty)
                                            Padding(
                                              padding: const EdgeInsets.only(right: 6.0),
                                              child: ElevatedButton.icon(
                                                onPressed: () => _viewPhotos(
                                                  context,
                                                  beforePhotos,
                                                  title: 'Before Photos (Attempt ${attemptIndex + 1})',
                                                ),
                                                icon: const Icon(Icons.camera_alt, size: 13, color: Colors.amberAccent),
                                                label: Text('Before (${beforePhotos.length})', style: const TextStyle(fontSize: 11)),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.amber[900]!.withOpacity(0.4),
                                                  foregroundColor: Colors.amber[200],
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                                ),
                                              ),
                                            ),
                                          if (afterPhotos != null && afterPhotos.isNotEmpty)
                                            ElevatedButton.icon(
                                              onPressed: () => _viewPhotos(
                                                context,
                                                afterPhotos,
                                                title: 'After Photos (Attempt ${attemptIndex + 1})',
                                              ),
                                              icon: const Icon(Icons.check_circle, size: 13, color: Colors.greenAccent),
                                              label: Text('After (${afterPhotos.length})', style: const TextStyle(fontSize: 11)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.teal[900],
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                              ),
                                            ),
                                        ],
                                      );
                                    }

                                    if (compPhotos == null || compPhotos.isEmpty) return const SizedBox.shrink();
                                    return ElevatedButton.icon(
                                      onPressed: () => _viewPhotos(
                                        context,
                                        compPhotos,
                                        title: 'Completion Attempt ${attemptIndex + 1}',
                                      ),
                                      icon: const Icon(Icons.photo_library, size: 14),
                                      label: Text('Photos (Attempt ${attemptIndex + 1})'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.teal[900],
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    );
                                  }),
                                ),
                              ] else if (hasPhotos) ...[
                                const SizedBox(height: 12),
                                ElevatedButton.icon(
                                  onPressed: () => _viewPhotos(context, photos),
                                  icon: const Icon(Icons.photo_library, size: 16),
                                  label: const Text('View Photos'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.teal[900],
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                ),
                              ]
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  final Map<String, dynamic> user;
  final String role;
  final VoidCallback? onLogout;

  const ProfileScreen({
    super.key,
    required this.user,
    required this.role,
    this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 48,
              backgroundColor: Colors.purple.shade900,
              child: Text(
                (user['name'] ?? 'U').substring(0, 1).toUpperCase(),
                style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user['name'] ?? 'No Name',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.purple.shade900.withOpacity(0.4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.purpleAccent.withOpacity(0.5)),
              ),
              child: Text(
                role.toUpperCase(),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purpleAccent),
              ),
            ),
            const SizedBox(height: 32),
            Card(
              color: Colors.grey.shade900.withOpacity(0.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.shade800),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildInfoRow(Icons.badge, 'Partner Code', user['code'] ?? '—'),
                    const Divider(color: Colors.grey),
                    _buildInfoRow(Icons.email, 'Email Address', user['email'] ?? '—'),
                    const Divider(color: Colors.grey),
                    _buildInfoRow(Icons.phone, 'Mobile Number', user['mobile'] ?? '—'),
                    if (user['contactPerson'] != null) ...[
                      const Divider(color: Colors.grey),
                      _buildInfoRow(Icons.person, 'Contact Person', user['contactPerson']),
                    ],
                    if (user['address'] != null) ...[
                      const Divider(color: Colors.grey),
                      _buildInfoRow(Icons.location_on, 'Address', user['address']),
                    ],
                    if (user['city'] != null) ...[
                      const Divider(color: Colors.grey),
                      _buildInfoRow(Icons.location_city, 'City', user['city']),
                    ],
                  ],
                ),
              ),
            ),
            if (onLogout != null) ...[
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  onLogout!();
                },
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade900,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.tealAccent, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(fontSize: 15, color: Colors.white, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class BoxCover {
  static get cover => BoxFit.cover;
}

class TicketFormScreen extends StatefulWidget {
  final String type;
  final String token;
  final String apiUrl;

  const TicketFormScreen({super.key, required this.type, required this.token, required this.apiUrl});

  @override
  State<TicketFormScreen> createState() => _TicketFormScreenState();
}

class _TicketFormScreenState extends State<TicketFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Controllers
  final _custName = TextEditingController();
  final _custMobile = TextEditingController();
  final _custAlt = TextEditingController();
  final _custAddress = TextEditingController();
  final _custPincode = TextEditingController();

  final _prodModel = TextEditingController();
  final _prodSerial = TextEditingController();
  final _prodInvoice = TextEditingController();
  final _prodDate = TextEditingController();

  final _serviceDesc = TextEditingController();
  final _visitDateController = TextEditingController();
  
  String _priority = 'medium';
  File? _selectedInvoice;
  final _picker = ImagePicker();

  // Dynamic lists and selection states
  List<dynamic> _appliances = [];
  List<dynamic> _brands = [];
  List<dynamic> _cities = [];
  String? _selectedApplianceId;
  String? _selectedApplianceName;
  String? _selectedBrandName;
  String? _selectedCity;

  @override
  void initState() {
    super.initState();
    _fetchAppliances();
    _fetchCities();
  }

  Future<void> _fetchCities() async {
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/cities?active=true'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _cities = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error fetching cities: $e');
    }
  }

  Future<void> _fetchAppliances() async {
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/appliances?active=true'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _appliances = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error fetching appliances: $e');
    }
  }

  Future<void> _fetchBrands(String applianceId) async {
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/brands?appliance=$applianceId&active=true'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _brands = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error fetching brands: $e');
    }
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedInvoice = File(pickedFile.path);
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final url = Uri.parse('${widget.apiUrl}/tickets');
      final request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer ${widget.token}';

      // Meta parameters
      request.fields['type'] = widget.type;
      request.fields['customer[name]'] = _custName.text.trim();
      request.fields['customer[mobile]'] = _custMobile.text.trim();
      request.fields['customer[alternateMobile]'] = _custAlt.text.trim();
      request.fields['customer[address]'] = _custAddress.text.trim();
      request.fields['customer[city]'] = _selectedCity ?? '';
      request.fields['customer[pincode]'] = _custPincode.text.trim();

      request.fields['product[category]'] = _selectedApplianceName ?? '';
      request.fields['product[name]'] = _selectedBrandName ?? '';
      request.fields['product[modelNumber]'] = _prodModel.text.trim();
      request.fields['product[serialNumber]'] = _prodSerial.text.trim();
      request.fields['product[invoiceNumber]'] = _prodInvoice.text.trim();
      
      if (_prodDate.text.isNotEmpty) {
        request.fields['product[purchaseDate]'] = _prodDate.text;
      }
      
      if (widget.type == 'service') {
        request.fields['serviceDetails[description]'] = _serviceDesc.text.trim();
        request.fields['serviceDetails[priority]'] = _priority;
      } else {
        request.fields['installationDetails[priority]'] = _priority;
      }

      if (_visitDateController.text.isNotEmpty) {
        request.fields['preferredVisitDate'] = _visitDateController.text;
        request.fields['installationDetails[preferredDate]'] = _visitDateController.text;
      }

      if (_selectedInvoice != null) {
        request.files.add(await http.MultipartFile.fromPath('invoiceImage', _selectedInvoice!.path));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request raised successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        String errorMessage = 'Failed to raise request';
        try {
          final errorData = jsonDecode(response.body);
          if (errorData != null && errorData['message'] != null) {
            errorMessage = errorData['message'];
          }
        } catch (_) {}
        throw Exception(errorMessage);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.type == 'installation' ? 'Raise Installation Request' : 'Raise Service Request'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSectionHeader('Customer Details'),
                  _buildTextField(_custName, 'Customer Name'),
                  _buildTextField(
                    _custMobile, 
                    'Mobile Number', 
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Mobile number is required';
                      if (val.trim().length != 10) return 'Enter a valid 10-digit mobile number';
                      return null;
                    },
                  ),
                  _buildTextField(
                    _custAlt, 
                    'Alternate Mobile', 
                    required: false, 
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    validator: (val) {
                      if (val != null && val.trim().isNotEmpty && val.trim().length != 10) {
                        return 'Enter a valid 10-digit mobile number';
                      }
                      return null;
                    },
                  ),
                  _buildTextField(_custAddress, 'Address'),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: DropdownButtonFormField<String>(
                      value: _selectedCity,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'City *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      ),
                      items: _cities.map<DropdownMenuItem<String>>((city) {
                        return DropdownMenuItem<String>(
                          value: city['name'] as String,
                          child: Text(city['name'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedCity = val;
                        });
                      },
                      validator: (val) => val == null ? 'Please select a city' : null,
                    ),
                  ),
                  _buildTextField(
                    _custPincode, 
                    'Pincode', 
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Pincode is required';
                      if (val.trim().length != 6) return 'Enter a valid 6-digit pincode';
                      return null;
                    },
                  ),

                  const SizedBox(height: 24),
                  _buildSectionHeader('Product Details'),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: DropdownButtonFormField<String>(
                      value: _selectedApplianceId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Appliance *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      ),
                      items: _appliances.map<DropdownMenuItem<String>>((appliance) {
                        return DropdownMenuItem<String>(
                          value: appliance['_id'] as String,
                          child: Text(appliance['name'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedApplianceId = val;
                          _selectedApplianceName = _appliances.firstWhere((a) => a['_id'] == val)['name'];
                          _selectedBrandName = null;
                          _brands = [];
                        });
                        if (val != null) {
                          _fetchBrands(val);
                        }
                      },
                      validator: (val) => val == null ? 'Please select an appliance' : null,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: DropdownButtonFormField<String>(
                      value: _selectedBrandName,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Brand *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      ),
                      items: _brands.map<DropdownMenuItem<String>>((brand) {
                        return DropdownMenuItem<String>(
                          value: brand['name'] as String,
                          child: Text(brand['name'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedBrandName = val;
                        });
                      },
                      validator: (val) => val == null ? 'Please select a brand' : null,
                    ),
                  ),
                  _buildTextField(_prodModel, 'Model Number', required: false),
                  _buildTextField(_prodSerial, 'Serial Number', required: false),
                  _buildTextField(_prodInvoice, 'Invoice Number', required: false),
                  _buildDateField(_prodDate, 'Purchase Date', required: false),
                  
                  if (widget.type == 'service') ...[
                    const SizedBox(height: 24),
                    _buildSectionHeader('Service Details'),
                    _buildTextField(_serviceDesc, 'Problem Description', maxLines: 3, required: false),
                    const SizedBox(height: 8),
                    const Text('Priority *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Row(
                      children: [
                        _buildPriorityRadio('low', 'Low'),
                        _buildPriorityRadio('medium', 'Mid'),
                        _buildPriorityRadio('high', 'High'),
                      ],
                    ),
                  ] else ...[
                    const SizedBox(height: 24),
                    _buildSectionHeader('Installation Details'),
                    const Text('Priority *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Row(
                      children: [
                        _buildPriorityRadio('low', 'Low'),
                        _buildPriorityRadio('medium', 'Mid'),
                        _buildPriorityRadio('high', 'High'),
                      ],
                    ),
                  ],

                  const SizedBox(height: 24),
                  _buildSectionHeader('Scheduling & Attachments'),
                  _buildDateField(_visitDateController, 'Preferred Visit Date & Time', required: true),
                  const SizedBox(height: 16),
                  
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.receipt_long),
                    label: Text(_selectedInvoice == null ? 'Upload Invoice Copy' : 'Invoice Attached (Tap to change)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueGrey[800],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                  if (_selectedInvoice != null) ...[
                    const SizedBox(height: 8),
                    Center(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(_selectedInvoice!, height: 120, width: 120, fit: BoxCover.cover),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Submit Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.tealAccent),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    bool required = true,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    int? maxLength,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        maxLength: maxLength,
        inputFormatters: inputFormatters,
        decoration: InputDecoration(
          labelText: label,
          counterText: '', // Hide default character counter
          border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
        validator: validator ?? (required ? (val) => val == null || val.isEmpty ? 'Field required' : null : null),
      ),
    );
  }

  Widget _buildDateField(TextEditingController controller, String label, {bool required = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextFormField(
        controller: controller,
        readOnly: true,
        decoration: InputDecoration(
          labelText: label + (required ? ' *' : ''),
          suffixIcon: const Icon(Icons.event),
          border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
        onTap: () async {
          final datePicked = await showDatePicker(
            context: context,
            initialDate: DateTime.now(),
            firstDate: DateTime.now().subtract(const Duration(days: 365)),
            lastDate: DateTime.now().add(const Duration(days: 365)),
          );
          if (datePicked != null) {
            final timePicked = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
            );
            if (timePicked != null) {
              final formattedTime = '${timePicked.hour.toString().padLeft(2, '0')}:${timePicked.minute.toString().padLeft(2, '0')}';
              setState(() {
                controller.text = '${datePicked.toIso8601String().split('T')[0]} $formattedTime';
              });
            }
          }
        },
        validator: required ? (val) => val == null || val.isEmpty ? 'Please select date and time' : null : null,
      ),
    );
  }

  Widget _buildPriorityRadio(String value, String label) {
    return Row(
      children: [
        Radio(
          value: value,
          groupValue: _priority,
          activeColor: Colors.tealAccent,
          onChanged: (val) {
            setState(() {
              _priority = val.toString();
            });
          },
        ),
        Text(label),
        const SizedBox(width: 16),
      ],
    );
  }
}
