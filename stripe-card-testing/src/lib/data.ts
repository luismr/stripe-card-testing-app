import { CustomerData, SavedPaymentMethod } from '@/types/stripe';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Local JSON file paths for data persistence during testing
const DATA_DIR = join(process.cwd(), 'data');
const CUSTOMERS_FILE = join(DATA_DIR, 'customers.json');
const PAYMENT_METHODS_FILE = join(DATA_DIR, 'payment-methods.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!existsSync(CUSTOMERS_FILE)) {
  writeFileSync(CUSTOMERS_FILE, JSON.stringify([], null, 2));
}

if (!existsSync(PAYMENT_METHODS_FILE)) {
  writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify([], null, 2));
}

// Customer data operations
export class CustomerDataStore {
  static getAll(): CustomerData[] {
    try {
      const data = readFileSync(CUSTOMERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading customers file:', error);
      return [];
    }
  }

  static getById(id: string): CustomerData | null {
    const customers = this.getAll();
    return customers.find(customer => customer.id === id) || null;
  }

  static getByEmail(email: string): CustomerData | null {
    const customers = this.getAll();
    return customers.find(customer => customer.email === email) || null;
  }

  static save(customer: CustomerData): void {
    const customers = this.getAll();
    const existingIndex = customers.findIndex(c => c.id === customer.id);
    
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    
    writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
  }

  static delete(id: string): boolean {
    const customers = this.getAll();
    const filteredCustomers = customers.filter(c => c.id !== id);
    
    if (filteredCustomers.length < customers.length) {
      writeFileSync(CUSTOMERS_FILE, JSON.stringify(filteredCustomers, null, 2));
      return true;
    }
    
    return false;
  }
}

// Payment method data operations
export class PaymentMethodDataStore {
  static getAll(): SavedPaymentMethod[] {
    try {
      const data = readFileSync(PAYMENT_METHODS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading payment methods file:', error);
      return [];
    }
  }

  static getByCustomerId(customerId: string): SavedPaymentMethod[] {
    const paymentMethods = this.getAll();
    return paymentMethods.filter(pm => pm.customerId === customerId);
  }

  static getById(id: string): SavedPaymentMethod | null {
    const paymentMethods = this.getAll();
    return paymentMethods.find(pm => pm.id === id) || null;
  }

  static save(paymentMethod: SavedPaymentMethod): void {
    const paymentMethods = this.getAll();
    const existingIndex = paymentMethods.findIndex(pm => pm.id === paymentMethod.id);
    
    if (existingIndex >= 0) {
      paymentMethods[existingIndex] = paymentMethod;
    } else {
      paymentMethods.push(paymentMethod);
    }
    
    writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify(paymentMethods, null, 2));
  }

  static delete(id: string): boolean {
    const paymentMethods = this.getAll();
    const filteredPaymentMethods = paymentMethods.filter(pm => pm.id !== id);
    
    if (filteredPaymentMethods.length < paymentMethods.length) {
      writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify(filteredPaymentMethods, null, 2));
      return true;
    }
    
    return false;
  }

  static setAsDefault(paymentMethodId: string, customerId: string): void {
    const paymentMethods = this.getAll();
    
    // Remove default flag from all customer's payment methods
    paymentMethods.forEach(pm => {
      if (pm.customerId === customerId) {
        pm.isDefault = false;
      }
    });
    
    // Set the specified payment method as default
    const targetPm = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (targetPm) {
      targetPm.isDefault = true;
    }
    
    writeFileSync(PAYMENT_METHODS_FILE, JSON.stringify(paymentMethods, null, 2));
  }
}

// Utility functions
export const generateTestCustomers = (): CustomerData[] => {
  return [
    {
      id: 'cus_test_001',
      email: 'john.doe@example.com',
      name: 'John Doe',
      created: Date.now(),
      paymentMethods: [],
    },
    {
      id: 'cus_test_002',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      created: Date.now(),
      paymentMethods: [],
    },
    {
      id: 'cus_test_003',
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      created: Date.now(),
      paymentMethods: [],
    },
  ];
};

export const initializeTestData = (): void => {
  const existingCustomers = CustomerDataStore.getAll();
  if (existingCustomers.length === 0) {
    const testCustomers = generateTestCustomers();
    testCustomers.forEach(customer => CustomerDataStore.save(customer));
    console.log('Initialized test customer data');
  }
};