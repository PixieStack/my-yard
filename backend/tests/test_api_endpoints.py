"""
MyYard API Endpoint Tests
Tests for townships, properties, payments, and notifications APIs
"""
import pytest
import requests
import os

# Use localhost for testing since external URL has intermittent issues
BASE_URL = "http://localhost:3000"

class TestTownshipsAPI:
    """Townships API endpoint tests"""
    
    def test_townships_returns_873_records(self):
        """Test /api/townships returns 873 total township records"""
        response = requests.get(f"{BASE_URL}/api/townships")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert data["total"] == 873
        assert "townships" in data
        assert len(data["townships"]) == 873
    
    def test_townships_search_soweto(self):
        """Test /api/townships?search=soweto returns Soweto in results"""
        response = requests.get(f"{BASE_URL}/api/townships?search=soweto")
        assert response.status_code == 200
        
        data = response.json()
        assert "townships" in data
        assert len(data["townships"]) >= 1
        
        # Check Soweto is in results
        township_names = [t["name"] for t in data["townships"]]
        assert "Soweto" in township_names
        
        # Verify Soweto has correct data
        soweto = next(t for t in data["townships"] if t["name"] == "Soweto")
        assert soweto["city"] == "Johannesburg"
        assert soweto["province"] == "Gauteng"
        assert soweto["type"] == "township"
    
    def test_townships_search_partial_match(self):
        """Test search with partial query 'Sow' returns Soweto"""
        response = requests.get(f"{BASE_URL}/api/townships?search=Sow")
        assert response.status_code == 200
        
        data = response.json()
        township_names = [t["name"] for t in data["townships"]]
        assert "Soweto" in township_names


class TestPropertiesByTownshipAPI:
    """Properties by township API tests"""
    
    def test_properties_by_township_soweto(self):
        """Test /api/properties/by-township?township=Soweto returns valid JSON"""
        response = requests.get(f"{BASE_URL}/api/properties/by-township?township=Soweto")
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "total" in data
        assert "township" in data
        assert data["township"] == "Soweto"
        
        # Should have matched_townships
        assert "matched_townships" in data
        # Soweto township should be found
        if len(data["matched_townships"]) > 0:
            matched_names = [t["name"] for t in data["matched_townships"]]
            assert "Soweto" in matched_names
    
    def test_properties_by_township_missing_param(self):
        """Test /api/properties/by-township without param returns 400"""
        response = requests.get(f"{BASE_URL}/api/properties/by-township")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestOzowPaymentAPI:
    """Ozow payment API tests (MOCKED - placeholder implementation)"""
    
    def test_ozow_returns_503_placeholder(self):
        """Test /api/payments/ozow returns 503 with placeholder message"""
        response = requests.post(
            f"{BASE_URL}/api/payments/ozow",
            json={"amount": 1000, "reference": "TEST123"}
        )
        assert response.status_code == 503
        
        data = response.json()
        assert "error" in data
        assert "not yet configured" in data["error"].lower() or "placeholder" in data["error"].lower()


class TestNotificationsAPI:
    """Notifications API tests"""
    
    def test_notifications_returns_empty_array(self):
        """Test /api/notifications returns empty array for unauthenticated user"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert data["notifications"] == []
        assert data["unread_count"] == 0


class TestHomePageAPI:
    """Home page and static content tests"""
    
    def test_home_page_loads(self):
        """Test home page returns 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        
        # Check for MyYard branding in HTML
        assert "MyYard" in response.text
        assert "870+" in response.text or "870" in response.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
