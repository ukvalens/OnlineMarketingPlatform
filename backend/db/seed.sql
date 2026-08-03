-- Seed default admin user (password: Admin@1234 — change immediately)
-- bcrypt hash of 'Admin@1234' with 12 rounds
INSERT INTO users (name, email, phone, password_hash, role)
VALUES (
  'Super Admin',
  'admin@digitalmarketing.rw',
  '+250780000000',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
  'admin'
);

-- Seed services
INSERT INTO services (name, description, category) VALUES
  ('Social Media Marketing', 'Grow your brand presence across Facebook, Instagram, Twitter, and LinkedIn.', 'Social Media'),
  ('Digital Advertising', 'Targeted paid ads on Google, Facebook, and other platforms.', 'Advertising'),
  ('Website Promotion', 'SEO and online visibility strategies to drive traffic to your website.', 'SEO'),
  ('Graphic Design', 'Professional logos, banners, flyers, and brand visuals.', 'Design'),
  ('Branding Services', 'Complete brand identity creation including logo, colors, and guidelines.', 'Branding'),
  ('Business Consulting', 'Strategic marketing advice tailored to your business goals.', 'Consulting'),
  ('Online Product Marketing', 'Promote and sell your products through digital channels.', 'E-commerce');

-- Seed packages for Social Media Marketing
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'basic', 50000, '3 posts/week, 1 platform, monthly report', 30 FROM services WHERE name = 'Social Media Marketing';
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'standard', 120000, '5 posts/week, 3 platforms, bi-weekly report, story creation', 30 FROM services WHERE name = 'Social Media Marketing';
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'premium', 250000, 'Daily posts, all platforms, weekly report, ads management, community management', 30 FROM services WHERE name = 'Social Media Marketing';

-- Seed packages for Graphic Design
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'basic', 30000, 'Logo design, 2 revisions', 7 FROM services WHERE name = 'Graphic Design';
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'standard', 75000, 'Logo + business card + letterhead, 4 revisions', 10 FROM services WHERE name = 'Graphic Design';
INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
SELECT id, 'premium', 150000, 'Full brand kit, unlimited revisions, source files', 14 FROM services WHERE name = 'Graphic Design';
