CREATE DATABASE IF NOT EXISTS cube_pos;
USE cube_pos;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(20) UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (name, price, stock, description) VALUES
  ('Classic Burger', 8.99, 50, 'Beef patty with lettuce, tomato, and special sauce'),
  ('Cheese Pizza', 12.99, 30, '12-inch pizza with mozzarella and marinara'),
  ('Caesar Salad', 7.99, 40, 'Romaine lettuce, croutons, parmesan, Caesar dressing'),
  ('French Fries', 4.99, 100, 'Crispy golden fries with sea salt'),
  ('Chicken Sandwich', 9.99, 35, 'Grilled chicken breast with mayo and lettuce'),
  ('Soda', 1.99, 200, 'Assorted fountain drinks'),
  ('Iced Tea', 2.49, 150, 'Fresh brewed iced tea'),
  ('Chocolate Shake', 4.99, 60, 'Thick chocolate milkshake with whipped cream');
