/**
 * Expense Tracker App.js
 * Handles authentication and dashboard functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    
    // --- AUTHENTICATION LOGIC ---
    
    // Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Signup successful! Please login.');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Signup failed');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during signup');
            }
        });
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during login');
            }
        });
    }

    // --- DASHBOARD LOGIC ---
    
    const dashboardPage = document.querySelector('.dashboard-page');
    if (dashboardPage) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Display User Info
        document.getElementById('userNameDisplay').textContent = user.name;
        document.getElementById('userInitial').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });

        // Modal Logic
        const modal = document.getElementById('expenseModal');
        const openModalBtn = document.getElementById('openModalBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const expenseForm = document.getElementById('expenseForm');

        const openModal = (expense = null) => {
            if (expense) {
                document.getElementById('modalTitle').textContent = 'Edit Expense';
                document.getElementById('expenseId').value = expense._id;
                document.getElementById('title').value = expense.title;
                document.getElementById('amount').value = expense.amount;
                document.getElementById('category').value = expense.category;
                document.getElementById('date').value = new Date(expense.date).toISOString().split('T')[0];
                document.getElementById('saveBtn').textContent = 'Update Expense';
            } else {
                document.getElementById('modalTitle').textContent = 'Add New Expense';
                expenseForm.reset();
                document.getElementById('expenseId').value = '';
                document.getElementById('saveBtn').textContent = 'Save Expense';
                document.getElementById('date').value = new Date().toISOString().split('T')[0];
            }
            modal.classList.add('active');
        };

        const closeModal = () => modal.classList.remove('active');

        openModalBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Fetch and Render Expenses
        const fetchExpenses = async () => {
            try {
                const res = await fetch(`${API_URL}/expenses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const expenses = await res.json();
                renderExpenses(expenses);
                updateStats(expenses);
            } catch (err) {
                console.error('Error fetching expenses:', err);
            }
        };

        const renderExpenses = (expenses) => {
            const tbody = document.getElementById('expenseTableBody');
            tbody.innerHTML = '';

            expenses.forEach(exp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${exp.title}</strong></td>
                    <td><span class="category-badge category-${exp.category.toLowerCase()}">${exp.category}</span></td>
                    <td class="${exp.category === 'Income' ? 'text-success' : ''}">
                        ${exp.category === 'Income' ? '+' : '-'}$${parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td>${new Date(exp.date).toLocaleDateString()}</td>
                    <td class="actions">
                        <button class="btn-icon btn-edit" onclick="editExpense('${exp._id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" onclick="deleteExpense('${exp._id}')"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        const updateStats = (expenses) => {
            let income = 0;
            let spent = 0;

            expenses.forEach(exp => {
                if (exp.category === 'Income') {
                    income += parseFloat(exp.amount);
                } else {
                    spent += parseFloat(exp.amount);
                }
            });

            document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `$${spent.toFixed(2)}`;
            document.getElementById('remainingBalance').textContent = `$${(income - spent).toFixed(2)}`;
        };

        // Global functions for edit/delete
        window.editExpense = async (id) => {
            try {
                const res = await fetch(`${API_URL}/expenses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const expenses = await res.json();
                const expense = expenses.find(e => e._id === id);
                if (expense) openModal(expense);
            } catch (err) {
                console.error(err);
            }
        };

        window.deleteExpense = async (id) => {
            if (!confirm('Are you sure you want to delete this expense?')) return;
            try {
                const res = await fetch(`${API_URL}/expenses/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) fetchExpenses();
            } catch (err) {
                console.error(err);
            }
        };

        // Handle Form Submit
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('expenseId').value;
            const expenseData = {
                title: document.getElementById('title').value,
                amount: parseFloat(document.getElementById('amount').value),
                category: document.getElementById('category').value,
                date: document.getElementById('date').value
            };

            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/expenses/${id}` : `${API_URL}/expenses`;

            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(expenseData)
                });

                if (res.ok) {
                    closeModal();
                    fetchExpenses();
                } else {
                    const data = await res.json();
                    alert(data.message || 'Error saving expense');
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Initial Load
        fetchExpenses();
    }
});
