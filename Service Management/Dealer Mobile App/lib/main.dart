import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(const DealerApp());
}

class DealerApp extends StatelessWidget {
  const DealerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GSP Dealer App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
          primary: Colors.deepPurple,
          surface: const Color(0xFF1E1B24),
        ),
        scaffoldBackgroundColor: const Color(0xFF121016),
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
        if (data['role'] != 'dealer') {
          throw Exception('Only dealer credentials can sign in here.');
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
                const Icon(Icons.handshake, size: 72, color: Colors.deepPurple),
                const SizedBox(height: 16),
                const Text(
                  'GSP Dealer Portal',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const Text(
                  'Raise and Track Service Requests',
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
                    labelText: 'Dealer Code (e.g. DLR-1001)',
                    prefixIcon: Icon(Icons.badge),
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Enter dealer code' : null,
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
                    backgroundColor: Colors.deepPurple,
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
  int _newCount = 0;
  int _openCount = 0;
  int _inProgressCount = 0;
  int _completedCount = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
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
        final List tickets = jsonDecode(res.body);
        int fresh = 0, open = 0, work = 0, done = 0;
        for (var t in tickets) {
          final s = t['status'];
          if (s == 'new') fresh++;
          if (s == 'assigned') open++;
          if (s == 'in_progress') work++;
          if (s == 'completed' || s == 'verification_pending') done++;
        }
        setState(() {
          _newCount = fresh;
          _openCount = open;
          _inProgressCount = work;
          _completedCount = done;
        });
      }
    } catch (e) {
      print('Error fetching statistics: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.user['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('Dealer Code: ${widget.user['code']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStats,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              const Text(
                'Request Status Counters',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              _isLoading 
                ? const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
                : GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.4,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      _buildStatCard('New Requests', _newCount, Colors.blue),
                      _buildStatCard('Total Open', _openCount, Colors.amber),
                      _buildStatCard('In Progress', _inProgressCount, Colors.orange),
                      _buildStatCard('Completed', _completedCount, Colors.green),
                    ],
                  ),
              const SizedBox(height: 32),
              const Text(
                'Quick Service Actions',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              _buildActionButton(
                context,
                'Raise Installation Request',
                'Schedule product installation for customers',
                Icons.construction,
                Colors.deepPurple,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketFormScreen(
                      type: 'installation',
                      token: widget.token,
                      apiUrl: widget.apiUrl,
                    ),
                  ),
                ).then((_) => _loadStats()),
              ),
              const SizedBox(height: 16),
              _buildActionButton(
                context,
                'Raise Service Request',
                'Report service or breakdown issues',
                Icons.support_agent,
                Colors.indigo,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketFormScreen(
                      type: 'service',
                      token: widget.token,
                      apiUrl: widget.apiUrl,
                    ),
                  ),
                ).then((_) => _loadStats()),
              ),
              const SizedBox(height: 16),
              _buildActionButton(
                context,
                'Track My Requests',
                'View all past and current status of requests',
                Icons.track_changes,
                Colors.blueGrey,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketListScreen(
                      token: widget.token,
                      apiUrl: widget.apiUrl,
                    ),
                  ),
                ).then((_) => _loadStats()),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int count, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        border: Border.all(color: color.withOpacity(0.35)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
          Text('$count', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1B24),
          border: Border.all(color: Colors.blueGrey.withOpacity(0.15)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
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
  final _custCity = TextEditingController();
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
  String? _selectedApplianceId;
  String? _selectedApplianceName;
  String? _selectedBrandName;

  @override
  void initState() {
    super.initState();
    _fetchAppliances();
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
      request.fields['customer[city]'] = _custCity.text.trim();
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
        final err = jsonDecode(response.body);
        throw Exception(err['message'] ?? 'Failed to submit request');
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
    final title = widget.type == 'installation' ? 'Raise Installation Request' : 'Raise Service Request';
    
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSectionHeader('Customer Information'),
                  _buildTextField(_custName, 'Customer Name'),
                  _buildTextField(_custMobile, 'Mobile Number', keyboardType: TextInputType.phone),
                  _buildTextField(_custAlt, 'Alternate Number (Optional)', keyboardType: TextInputType.phone, required: false),
                  _buildTextField(_custAddress, 'Address'),
                  _buildTextField(_custCity, 'City'),
                  _buildTextField(_custPincode, 'Pincode', keyboardType: TextInputType.number),
                  
                  const SizedBox(height: 24),
                  _buildSectionHeader('Product Information'),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: DropdownButtonFormField<String>(
                      value: _selectedApplianceId,
                      decoration: const InputDecoration(
                        labelText: 'Select Appliance',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      ),
                      items: _appliances.map<DropdownMenuItem<String>>((app) {
                        return DropdownMenuItem<String>(
                          value: app['_id'] as String,
                          child: Text(app['name'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          final selectedApp = _appliances.firstWhere((app) => app['_id'] == val);
                          setState(() {
                            _selectedApplianceId = val;
                            _selectedApplianceName = selectedApp['name'] as String;
                            _brands = [];
                            _selectedBrandName = null;
                          });
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
                      decoration: const InputDecoration(
                        labelText: 'Select Brand',
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
                  _buildTextField(_prodModel, 'Model Number'),
                  _buildTextField(_prodSerial, 'Serial Number', required: false),
                  _buildTextField(_prodInvoice, 'Invoice Number', required: false),
                  _buildDateField(_prodDate, 'Purchase Date (Optional)'),
                  
                  if (widget.type == 'service') ...[
                    const SizedBox(height: 24),
                    _buildSectionHeader('Service Details'),
                    _buildTextField(_serviceDesc, 'Problem Description', maxLines: 3),
                    const SizedBox(height: 8),
                    const Text('Priority', style: TextStyle(fontSize: 13, color: Colors.grey)),
                    Row(
                      children: [
                        _buildPriorityRadio('low', 'Low'),
                        _buildPriorityRadio('medium', 'Medium'),
                        _buildPriorityRadio('high', 'High'),
                      ],
                    ),
                  ],

                  const SizedBox(height: 24),
                  _buildSectionHeader('Scheduling & Attachments'),
                  _buildDateField(_visitDateController, 'Preferred Visit/Installation Date'),
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
                      backgroundColor: Colors.deepPurple,
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
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.purpleAccent),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    bool required = true,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
        validator: required ? (val) => val == null || val.isEmpty ? 'Field required' : null : null,
      ),
    );
  }

  Widget _buildDateField(TextEditingController controller, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: TextFormField(
        controller: controller,
        readOnly: true,
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_month),
          border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        ),
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.now(),
            firstDate: DateTime.now().subtract(const Duration(days: 365)),
            lastDate: DateTime.now().add(const Duration(days: 365)),
          );
          if (picked != null) {
            setState(() {
              controller.text = picked.toIso8601String().split('T')[0];
            });
          }
        },
      ),
    );
  }

  Widget _buildPriorityRadio(String value, String label) {
    return Row(
      children: [
        Radio(
          value: value,
          groupValue: _priority,
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

class BoxCover {
  static get cover => BoxFit.cover;
}

class TicketListScreen extends StatefulWidget {
  final String token;
  final String apiUrl;

  const TicketListScreen({super.key, required this.token, required this.apiUrl});

  @override
  State<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends State<TicketListScreen> {
  List _tickets = [];
  bool _isLoading = false;
  String _selectedStatusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  Future<void> _fetchTickets() async {
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
        setState(() {
          _tickets = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error fetching tickets: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filter logic
    final filteredTickets = _tickets.where((t) {
      if (_selectedStatusFilter == 'all') return true;
      if (_selectedStatusFilter == 'new') return t['status'] == 'new';
      if (_selectedStatusFilter == 'assigned') return t['status'] == 'assigned';
      if (_selectedStatusFilter == 'in_progress') return t['status'] == 'in_progress';
      if (_selectedStatusFilter == 'completed') return t['status'] == 'completed' || t['status'] == 'verification_pending';
      if (_selectedStatusFilter == 'closed') return t['status'] == 'closed';
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Requests')),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : filteredTickets.isEmpty
                ? const Center(child: Text('No requests found', style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: filteredTickets.length,
                    itemBuilder: (context, index) {
                      final t = filteredTickets[index];
                      return _buildTicketCard(t);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      height: 48,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _buildTabButton('all', 'All'),
          _buildTabButton('new', 'New'),
          _buildTabButton('assigned', 'Assigned'),
          _buildTabButton('in_progress', 'In Progress'),
          _buildTabButton('completed', 'Completed'),
          _buildTabButton('closed', 'Closed'),
        ],
      ),
    );
  }

  Widget _buildTabButton(String value, String label) {
    final active = _selectedStatusFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: ChoiceChip(
        label: Text(label),
        selected: active,
        onSelected: (sel) {
          setState(() {
            _selectedStatusFilter = value;
          });
        },
      ),
    );
  }

  Widget _buildTicketCard(Map<String, dynamic> t) {
    final status = t['status'] ?? 'new';
    Color statusColor = Colors.blue;
    if (status == 'assigned') statusColor = Colors.amber;
    if (status == 'in_progress') statusColor = Colors.orange;
    if (status == 'completed' || status == 'verification_pending') statusColor = Colors.green;
    if (status == 'closed') statusColor = Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF1E1B24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.blueGrey.withOpacity(0.15)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(t['ticketNumber'] ?? 'TKT-????', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                status.replaceAll('_', ' ').toUpperCase(),
                style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text('Customer: ${t['customer']['name']}', style: const TextStyle(color: Colors.white, fontSize: 14)),
            const SizedBox(height: 4),
            Text('Product: ${t['product']['name']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 4),
            Text('Technician: ${t['assignedTechnician']?['name'] ?? 'Unassigned'}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketDetailsScreen(
                ticketId: t['_id'],
                token: widget.token,
                apiUrl: widget.apiUrl,
              ),
            ),
          );
        },
      ),
    );
  }
}

class TicketDetailsScreen extends StatefulWidget {
  final String ticketId;
  final String token;
  final String apiUrl;

  const TicketDetailsScreen({super.key, required this.ticketId, required this.token, required this.apiUrl});

  @override
  State<TicketDetailsScreen> createState() => _TicketDetailsScreenState();
}

class _TicketDetailsScreenState extends State<TicketDetailsScreen> {
  Map<String, dynamic>? _ticket;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadTicket();
  }

  Future<void> _loadTicket() async {
    setState(() => _isLoading = true);
    try {
      final res = await http.get(
        Uri.parse('${widget.apiUrl}/tickets/${widget.ticketId}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}'
        },
      );
      if (res.statusCode == 200) {
        setState(() {
          _ticket = jsonDecode(res.body);
        });
      }
    } catch (e) {
      print('Error loading ticket details: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_ticket == null) return const Scaffold(body: Center(child: Text('Ticket not found')));

    return Scaffold(
      appBar: AppBar(title: Text(_ticket!['ticketNumber'] ?? 'Ticket Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildDetailBlock('Customer Details', [
              'Name: ${_ticket!['customer']['name']}',
              'Mobile: ${_ticket!['customer']['mobile']}',
              'Address: ${_ticket!['customer']['address']}',
              'City: ${_ticket!['customer']['city']}',
              'Pincode: ${_ticket!['customer']['pincode']}',
            ]),
            const SizedBox(height: 16),
            _buildDetailBlock('Product Details', [
              'Category: ${_ticket!['product']['category']}',
              'Name: ${_ticket!['product']['name']}',
              'Model: ${_ticket!['product']['modelNumber'] ?? 'N/A'}',
              'Serial: ${_ticket!['product']['serialNumber'] ?? 'N/A'}',
            ]),
            const SizedBox(height: 16),
            _buildDetailBlock('Technician Details', [
              'Name: ${_ticket!['assignedTechnician']?['name'] ?? 'Not Assigned'}',
              'Mobile: ${_ticket!['assignedTechnician']?['mobile'] ?? 'N/A'}',
            ]),
            const SizedBox(height: 16),
            if (_ticket!['completion'] != null) ...[
              _buildDetailBlock('Completion Info', [
                'Work Done: ${_ticket!['completion']['workDone']}',
                'Remarks: ${_ticket!['completion']['remarks'] ?? 'None'}',
              ]),
              const SizedBox(height: 16),
            ],
            _buildTimelineBlock(_ticket!['timeline'] ?? []),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailBlock(String title, List<String> details) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1B24),
        border: Border.all(color: Colors.blueGrey.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.purpleAccent)),
          const SizedBox(height: 12),
          ...details.map((d) => Padding(
            padding: const EdgeInsets.only(bottom: 6.0),
            child: Text(d, style: const TextStyle(fontSize: 13, color: Colors.white70)),
          )),
        ],
      ),
    );
  }

  Widget _buildTimelineBlock(List timeline) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1B24),
        border: Border.all(color: Colors.blueGrey.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Timeline History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.purpleAccent)),
          const SizedBox(height: 12),
          ...timeline.map((entry) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 4.0, right: 12.0),
                  child: Icon(Icons.circle, size: 8, color: Colors.deepPurple),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry['status'].toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white)),
                      Text(entry['note'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(
                        'By: ${entry['updatedBy']} • ${DateTime.parse(entry['timestamp']).toLocal()}', 
                        style: const TextStyle(fontSize: 9, color: Colors.grey)
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}
