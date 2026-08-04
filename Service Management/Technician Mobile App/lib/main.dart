import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
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
    _checkLogin();
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
  }

  Future<void> _saveLogin(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', jsonEncode(user));
    setState(() {
      _token = token;
      _userData = user;
    });
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
  int _pendingCount = 0;
  int _completedCount = 0;
  bool _isLoading = false;
  List _jobs = [];

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => _isLoading = true);
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        final List jobsData = jsonDecode(res.body);
        int assigned = 0, pending = 0, completed = 0;
        for (var job in jobsData) {
          final s = job['status'];
          if (s == 'assigned') assigned++;
          if (s == 'in_progress') pending++;
          if (s == 'completed' || s == 'verification_pending' || s == 'closed') completed++;
        }
        setState(() {
          _jobs = jobsData;
          _assignedCount = assigned;
          _pendingCount = pending;
          _completedCount = completed;
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
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogout,
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
              const Text(
                'Job Metrics',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              _isLoading 
                ? const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
                : GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.0,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildStatCard('Assigned', _assignedCount, Colors.amber),
                      _buildStatCard('Pending', _pendingCount, Colors.orange),
                      _buildStatCard('Finished', _completedCount, Colors.green),
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

  Widget _buildStatCard(String title, int count, Color color) {
    return Container(
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
          Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          Text('$count', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
        ],
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
              ),
            ),
          ).then((_) => _loadJobs());
        },
      ),
    );
  }

  Widget _buildHistoryButton() {
    return ElevatedButton.icon(
      onPressed: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => JobHistoryScreen(
            jobs: _jobs.where((j) => j['status'] == 'completed' || j['status'] == 'verification_pending' || j['status'] == 'closed').toList(),
          ),
        ),
      ),
      icon: const Icon(Icons.history),
      label: const Text('View Job History'),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blueGrey[850],
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

class JobDetailsScreen extends StatefulWidget {
  final String jobId;
  final String token;
  final String apiUrl;

  const JobDetailsScreen({super.key, required this.jobId, required this.token, required this.apiUrl});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  Map<String, dynamic>? _job;
  bool _isLoading = false;
  final _workDoneController = TextEditingController();
  final _remarksController = TextEditingController();
  final List<File> _completionPhotos = [];
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadJob();
  }

  Future<void> _loadJob() async {
    setState(() => _isLoading = true);
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets/${widget.jobId}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        setState(() {
          _job = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error loading job details: $e');
    } finally {
      setState(() => _isLoading = false);
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

  Future<void> _pickImage() async {
    if (_completionPhotos.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 5 images allowed')));
      return;
    }
    final pickedFile = await _picker.pickImage(source: ImageSource.camera);
    if (pickedFile != null) {
      setState(() {
        _completionPhotos.add(File(pickedFile.path));
      });
    }
  }

  Future<void> _submitCompletion() async {
    if (_workDoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please specify work done details')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final url = Uri.parse('${widget.apiUrl}/tickets/${widget.jobId}/complete');
      final request = http.MultipartRequest('PATCH', url);
      request.headers['Authorization'] = 'Bearer ${widget.token}';
      
      request.fields['workDone'] = _workDoneController.text.trim();
      request.fields['remarks'] = _remarksController.text.trim();

      for (var file in _completionPhotos) {
        request.files.add(await http.MultipartFile.fromPath('photos', file.path));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Work completion submitted for approval!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        throw Exception('Failed to submit job completion');
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
            _buildDetailBlock('Customer Details', [
              'Name: ${_job!['customer']['name']}',
              'Mobile: ${_job!['customer']['mobile']}',
              'Alt Mobile: ${_job!['customer']['alternateMobile'] ?? 'N/A'}',
              'Address: ${_job!['customer']['address']}',
              'City: ${_job!['customer']['city']} - ${_job!['customer']['pincode']}',
            ]),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () {
                // Call client action simulation
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Dialing client mobile: ${_job!['customer']['mobile']}...')),
                );
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
              if (_job!['serviceDetails']?['description'] != null)
                'Issue: ${_job!['serviceDetails']['description']}',
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
            ElevatedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.camera_alt),
              label: const Text('Take Completion Photo'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey[800], foregroundColor: Colors.white),
            ),
            if (_completionPhotos.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _completionPhotos.map((f) => Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.file(f, height: 70, width: 70, fit: BoxFit.cover),
                    ),
                    Positioned(
                      right: 0,
                      top: 0,
                      child: GestureDetector(
                        onTap: () => setState(() => _completionPhotos.remove(f)),
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
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitCompletion,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
              child: const Text('Submit Completion Details'),
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
}

class JobHistoryScreen extends StatelessWidget {
  final List jobs;

  const JobHistoryScreen({super.key, required this.jobs});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Job History')),
      body: jobs.isEmpty
        ? const Center(child: Text('No historical jobs found', style: TextStyle(color: Colors.grey)))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final job = jobs[index];
              return Card(
                color: const Color(0xFF1E2422),
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(job['ticketNumber'] ?? 'TKT-????', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Customer: ${job['customer']['name']}\nDevice: ${job['product']['name']}\nStatus: ${job['status'].toString().toUpperCase()}'),
                  trailing: const Icon(Icons.verified, color: Colors.green),
                ),
              );
            },
          ),
    );
  }
}
