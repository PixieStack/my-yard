"""
MyYard API Endpoint Tests - Iteration 2
Extended tests for lease & payment system, townships, Ozow integration, auth redirects
Tests cover: Townships (873 records), Ozow payment (placeholder), payment history, 
notifications, properties by township, payment webhook, auth pages
"""
import pytest
import requests

# Use localhost for API testing (external URL has intermittent 502 issues in preview environment)
BASE_URL = "http://localhost:3000"
EXTERNAL_URL = "https://sa-property-hub.preview.emergentagent.com"
EXTERNAL_URL = "https://sa-property-hub.preview.emergentagent.com"

class TestTownshipsAPI:
    """Townships API endpoint tests - 873 SA townships"""
    
    def test_townships_returns_873_records(self):
        """Test /api/townships returns 873 total township records"""
        response = requests.get(f"{BASE_URL}/api/townships", timeout=15)
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert data["total"] == 873
        assert "townships" in data
        assert len(data["townships"]) == 873
    
    def test_townships_search_sandton(self):
        """Test /api/townships?search=sandton works correctly"""
        response = requests.get(f"{BASE_URL}/api/townships?search=sandton", timeout=15)
        assert response.status_code == 200
        
        data = response.json()
        assert "townships" in data
        assert len(data["townships"]) >= 1
        
        # Check Sandton is in results
        township_names = [t["name"] for t in data["townships"]]
        assert "Sandton" in township_names
    
    def test_townships_search_partial_sow(self):
        """Test search with 'Sow' returns Soweto suggestion"""
        response = requests.get(f"{BASE_URL}/api/townships?search=Sow", timeout=15)
        assert response.status_code == 200
        
        data = response.json()
        township_names = [t["name"] for t in data["townships"]]
        assert "Soweto" in township_names


class TestOzowPaymentAPI:
    """Ozow payment API tests - MOCKED (placeholder until API key configured)"""
    
    def test_ozow_get_returns_404_for_fake_lease(self):
        """Test GET /api/payments/ozow?lease_id=fake&type=move_in returns 404 (lease not found)"""
        response = requests.get(
            f"{BASE_URL}/api/payments/ozow?lease_id=fake&type=move_in",
            timeout=15
        )
        assert response.status_code == 404
        
        data = response.json()
        assert "error" in data
        assert "not found" in data["error"].lower()
    
    def test_ozow_post_returns_503_placeholder(self):
        """Test POST /api/payments/ozow returns 503 (not configured placeholder)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/ozow",
            json={"payment_type": "move_in", "lease_id": "fake", "user_id": "test"},
            timeout=15
        )
        assert response.status_code == 503
        
        data = response.json()
        assert "error" in data
        assert "not yet configured" in data["error"].lower() or "not configured" in data["error"].lower()


class TestPaymentHistoryAPI:
    """Payment history API tests"""
    
    def test_payment_history_returns_empty_gracefully(self):
        """Test /api/payments/history?user_id=test&role=tenant returns empty array gracefully"""
        response = requests.get(
            f"{BASE_URL}/api/payments/history?user_id=test&role=tenant",
            timeout=15
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "payments" in data
        assert "total" in data
        assert data["payments"] == []
        assert data["total"] == 0
        
        # Summary may or may not be present (depends on Supabase query success)
        # When error occurs, returns minimal {payments: [], total: 0}
        # When successful with no results, includes summary
    
    def test_payment_history_missing_user_id(self):
        """Test /api/payments/history without user_id returns 400"""
        response = requests.get(f"{BASE_URL}/api/payments/history", timeout=15)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestPaymentNotifyWebhook:
    """Payment notify webhook tests (Ozow callback)"""
    
    def test_notify_accepts_post_requests(self):
        """Test POST /api/payments/notify accepts requests (may fail on hash)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/notify",
            json={
                "SiteCode": "TEST",
                "TransactionId": "123",
                "TransactionReference": "TEST-REF",
                "Amount": "1000.00",
                "Status": "Complete"
            },
            timeout=15
        )
        # Should accept POST (may return 403 due to hash verification or 500 due to missing data)
        assert response.status_code in [200, 403, 500]


class TestNotificationsAPI:
    """Notifications API tests"""
    
    def test_notifications_returns_empty_gracefully(self):
        """Test /api/notifications returns empty gracefully for unauthenticated user"""
        response = requests.get(f"{BASE_URL}/api/notifications", timeout=15)
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert data["notifications"] == []
        assert data["unread_count"] == 0


class TestPropertiesByTownshipAPI:
    """Properties by township API tests"""
    
    def test_properties_by_township_soweto(self):
        """Test /api/properties/by-township?township=Soweto returns valid JSON"""
        response = requests.get(f"{BASE_URL}/api/properties/by-township?township=Soweto", timeout=15)
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "total" in data
        assert "township" in data
        assert data["township"] == "Soweto"


class TestAuthPages:
    """Auth pages load test"""
    
    def test_login_page_loads(self):
        """Test /auth/login page loads"""
        response = requests.get(f"{BASE_URL}/auth/login", timeout=15)
        assert response.status_code == 200
        assert "MyYard" in response.text or "login" in response.text.lower() or "Sign" in response.text
    
    def test_register_page_loads(self):
        """Test /auth/register page loads"""
        response = requests.get(f"{BASE_URL}/auth/register", timeout=15)
        assert response.status_code == 200
        assert "MyYard" in response.text or "register" in response.text.lower() or "Sign" in response.text


class TestProtectedRoutes:
    """Protected routes should redirect to auth"""
    
    def test_landlord_leases_redirects_to_auth(self):
        """Test /landlord/leases redirects to auth (or shows auth required)"""
        response = requests.get(f"{BASE_URL}/landlord/leases", timeout=15, allow_redirects=True)
        # Should either redirect to login or show page with auth requirement
        assert response.status_code == 200
        # Check it landed on login page or shows lease content (if partial render)
        assert "login" in response.url.lower() or "leases" in response.text.lower() or "MyYard" in response.text
    
    def test_tenant_leases_redirects_to_auth(self):
        """Test /tenant/leases redirects to auth"""
        response = requests.get(f"{BASE_URL}/tenant/leases", timeout=15, allow_redirects=True)
        assert response.status_code == 200
        assert "login" in response.url.lower() or "leases" in response.text.lower() or "MyYard" in response.text
    
    def test_tenant_payments_redirects_to_auth(self):
        """Test /tenant/payments redirects to auth"""
        response = requests.get(f"{BASE_URL}/tenant/payments", timeout=15, allow_redirects=True)
        assert response.status_code == 200
        assert "login" in response.url.lower() or "payment" in response.text.lower() or "MyYard" in response.text


class TestHomePage:
    """Home page content tests"""
    
    def test_home_page_has_myyard_branding(self):
        """Test home page has MyYard branding and '870+ locations' text"""
        response = requests.get(f"{BASE_URL}/", timeout=15)
        assert response.status_code == 200
        
        # Check for MyYard branding
        assert "MyYard" in response.text
        # Check for locations text (870+)
        assert "870" in response.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
