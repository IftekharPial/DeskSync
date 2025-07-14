#!/bin/bash

# Comprehensive Webhook Testing Script
# Tests all webhook functionality including creation, triggering, Slack notifications, and meeting creation

set -e

# Configuration
BASE_URL="http://localhost:3000"
WEBHOOK_TOKEN="iMexK2IL34QhLltjKWMogKMHkrxfmJKQ"
WEBHOOK_URL="${BASE_URL}/webhook/${WEBHOOK_TOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local payload="$3"
    local should_succeed="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Testing: $test_name"
    
    # Make the request and capture both status and response
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "User-Agent: WebhookTester/1.0" \
        -d "$payload" \
        "$WEBHOOK_URL")
    
    # Extract status and body
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    # Check if status matches expected
    if [ "$http_status" -eq "$expected_status" ]; then
        if [ "$should_succeed" = "true" ]; then
            # Check if response indicates success
            if echo "$response_body" | grep -q '"success":true'; then
                log_success "$test_name - Passed"
                # Extract and display key information
                meeting_id=$(echo "$response_body" | grep -o '"meetingReportId":"[^"]*"' | cut -d'"' -f4)
                payload_id=$(echo "$response_body" | grep -o '"payloadLogId":"[^"]*"' | cut -d'"' -f4)
                successful=$(echo "$response_body" | grep -o '"successful":[0-9]*' | cut -d: -f2)
                total=$(echo "$response_body" | grep -o '"total":[0-9]*' | cut -d: -f2)
                
                [ -n "$meeting_id" ] && echo "  Meeting ID: $meeting_id"
                [ -n "$payload_id" ] && echo "  Payload Log ID: $payload_id"
                [ -n "$successful" ] && [ -n "$total" ] && echo "  Deliveries: $successful/$total successful"
                
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            else
                log_error "$test_name - Failed: Expected success but got failure"
                echo "  Response: $response_body"
                return 1
            fi
        else
            log_success "$test_name - Passed (correctly rejected)"
            error_msg=$(echo "$response_body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
            [ -n "$error_msg" ] && echo "  Error message: $error_msg"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        fi
    else
        log_error "$test_name - Failed: Expected status $expected_status, got $http_status"
        echo "  Response: $response_body"
        return 1
    fi
}

# Test webhook verification (GET request)
test_webhook_verification() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Testing webhook verification (GET request)"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$WEBHOOK_URL")
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_status" -eq 200 ] && echo "$response_body" | grep -q '"success":true'; then
        log_success "Webhook verification - Passed"
        webhook_name=$(echo "$response_body" | grep -o '"webhookName":"[^"]*"' | cut -d'"' -f4)
        webhook_id=$(echo "$response_body" | grep -o '"webhookId":"[^"]*"' | cut -d'"' -f4)
        [ -n "$webhook_name" ] && echo "  Webhook Name: $webhook_name"
        [ -n "$webhook_id" ] && echo "  Webhook ID: $webhook_id"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "Webhook verification - Failed"
        echo "  Response: $response_body"
        return 1
    fi
}

# Test invalid webhook token
test_invalid_token() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Testing invalid webhook token"
    
    invalid_url="${BASE_URL}/webhook/invalid-token-123"
    payload='{"meeting_id":"test-invalid","title":"Test","start_time":"2024-01-20T10:00:00Z","end_time":"2024-01-20T11:00:00Z","participants":[],"summary":"Test"}'
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$invalid_url")
    
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$http_status" -eq 404 ]; then
        log_success "Invalid webhook token - Passed (correctly rejected)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "Invalid webhook token - Failed: Expected 404, got $http_status"
        return 1
    fi
}

# Test malformed JSON
test_malformed_json() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Testing malformed JSON payload"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "invalid json payload" \
        "$WEBHOOK_URL")
    
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$http_status" -ge 400 ]; then
        log_success "Malformed JSON - Passed (correctly rejected)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "Malformed JSON - Failed: Expected error status, got $http_status"
        return 1
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}\n🚀 Starting Comprehensive Webhook Tests\n${NC}"
    
    # Test webhook verification
    test_webhook_verification
    
    # Test invalid token
    test_invalid_token
    
    # Test malformed JSON
    test_malformed_json
    
    # Test valid webhook payload
    timestamp=$(date +%s)
    payload="{\"meeting_id\":\"test-${timestamp}-1\",\"title\":\"Test Meeting - Valid Payload\",\"start_time\":\"2024-01-20T10:00:00Z\",\"end_time\":\"2024-01-20T11:00:00Z\",\"participants\":[{\"name\":\"Alice Johnson\",\"email\":\"alice@test.com\"},{\"name\":\"Bob Smith\",\"email\":\"bob@test.com\"}],\"summary\":\"This is a test meeting to verify webhook processing functionality.\"}"
    run_test "Valid webhook payload processing" 200 "$payload" "true"
    
    # Test missing required fields
    payload="{\"meeting_id\":\"test-${timestamp}-2\",\"title\":\"Test Meeting - Missing Fields\",\"participants\":[{\"name\":\"Charlie Brown\",\"email\":\"charlie@test.com\"}],\"summary\":\"This payload is missing required fields.\"}"
    run_test "Missing required fields" 400 "$payload" "false"
    
    # Test empty participants
    payload="{\"meeting_id\":\"test-${timestamp}-3\",\"title\":\"Test Meeting - Empty Participants\",\"start_time\":\"2024-01-21T14:00:00Z\",\"end_time\":\"2024-01-21T15:00:00Z\",\"participants\":[],\"summary\":\"This meeting has no participants.\"}"
    run_test "Empty participants array" 200 "$payload" "true"
    
    # Test long meeting duration
    payload="{\"meeting_id\":\"test-${timestamp}-4\",\"title\":\"Test Meeting - Long Duration\",\"start_time\":\"2024-01-22T09:00:00Z\",\"end_time\":\"2024-01-22T17:00:00Z\",\"participants\":[{\"name\":\"David Wilson\",\"email\":\"david@test.com\"},{\"name\":\"Eva Martinez\",\"email\":\"eva@test.com\"}],\"summary\":\"This is a long 8-hour meeting to test extended duration handling.\"}"
    run_test "Long meeting duration" 200 "$payload" "true"
    
    # Test special characters
    payload="{\"meeting_id\":\"test-${timestamp}-5\",\"title\":\"Test Meeting - Special Chars\",\"start_time\":\"2024-01-23T13:00:00Z\",\"end_time\":\"2024-01-23T14:00:00Z\",\"participants\":[{\"name\":\"José García\",\"email\":\"jose@test.com\"}],\"summary\":\"Testing special characters and unicode.\"}"
    run_test "Special characters in content" 200 "$payload" "true"
    
    # Summary
    echo -e "${BLUE}\n📊 Test Results Summary\n${NC}"
    echo "Total Tests: $TOTAL_TESTS"
    
    if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
        echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
        echo -e "${GREEN}Failed: 0${NC}"
        echo "Success Rate: 100.0%"
        log_success "\n🎉 All webhook tests passed! The webhook system is functioning correctly."
        exit 0
    else
        failed_tests=$((TOTAL_TESTS - PASSED_TESTS))
        echo -e "${YELLOW}Passed: $PASSED_TESTS${NC}"
        echo -e "${RED}Failed: $failed_tests${NC}"
        success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
        echo "Success Rate: ${success_rate}%"
        log_warning "\n⚠️  $failed_tests test(s) failed. Please review the issues above."
        exit 1
    fi
}

# Run main function
main
