-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on user_type for filtering
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow service role to do everything
-- This is needed for server-side operations
CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for public user info (without sensitive data)
CREATE OR REPLACE VIEW public_users AS
SELECT 
  id,
  name,
  user_type,
  created_at
FROM users;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on department name
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read departments
CREATE POLICY "Authenticated users can view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update/delete departments
CREATE POLICY "Admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category name
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read categories
CREATE POLICY "Authenticated users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update/delete categories
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  date_purchased DATE NOT NULL,
  cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on assets
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_by ON assets(created_by);
CREATE INDEX IF NOT EXISTS idx_assets_date_purchased ON assets(date_purchased);

-- Enable RLS on assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own assets
CREATE POLICY "Users can view their own assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Policy: Admins can view all assets
CREATE POLICY "Admins can view all assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Policy: Authenticated users can create assets
CREATE POLICY "Users can create assets"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Policy: Only admins can delete assets
CREATE POLICY "Admins can delete assets"
  ON assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Service role full access policies (for API routes)
CREATE POLICY "Service role has full access to departments"
  ON departments
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to assets"
  ON assets
  FOR ALL
  USING (true)
  WITH CHECK (true);

