import cv2
import numpy as np

def nothing(x):
    pass

def main():
    cap = cv2.VideoCapture(1)

    if not cap.isOpened():
        print("Error: Could not open camera feed.")
        return

    window_name = 'Live Calibration & Tracking'
    cv2.namedWindow(window_name)

    # UI Trackbars
    cv2.createTrackbar('Contrast(x10)', window_name, 7, 30, nothing)
    cv2.createTrackbar('Brightness', window_name, 0, 150, nothing)
    cv2.createTrackbar('Sobel Thresh', window_name, 7, 255, nothing)
    cv2.createTrackbar('Global ROI Top (%)', window_name, 65, 100, nothing)
    cv2.createTrackbar('Global ROI Bot (%)', window_name, 72, 100, nothing)
    cv2.createTrackbar('Hough Thresh', window_name, 30, 200, nothing)

    # Tracking Variable
    last_known_y = None

    print("Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        h, w = frame.shape[:2]

        # 1. Read Current Trackbar Values
        alpha = cv2.getTrackbarPos('Contrast(x10)', window_name) / 10.0
        beta = cv2.getTrackbarPos('Brightness', window_name)
        sobel_thresh = cv2.getTrackbarPos('Sobel Thresh', window_name)
        global_roi_top_pct = cv2.getTrackbarPos('Global ROI Top (%)', window_name) / 100.0
        global_roi_bot_pct = cv2.getTrackbarPos('Global ROI Bot (%)', window_name) / 100.0
        hough_thresh = max(1, cv2.getTrackbarPos('Hough Thresh', window_name))

        # 2. Fix Lighting
        frame_adjusted = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

        # 3. Preprocessing & Sobel Y Edge Detection
        gray = cv2.cvtColor(frame_adjusted, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        abs_sobel_y = cv2.convertScaleAbs(sobel_y)
        _, edges = cv2.threshold(abs_sobel_y, sobel_thresh, 255, cv2.THRESH_BINARY)

        # 4. Morphology to clean up horizontal edges
        kernel_width = max(1, w // 20)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_width, 1))
        horizontal_edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)

        # 5. DYNAMIC ROI LOGIC
        if last_known_y is None:
            # We are lost. Use the wide, global search area.
            roi_top = int(h * global_roi_top_pct)
            roi_bottom = int(h * global_roi_bot_pct)
            roi_color = (255, 0, 0) # Blue means Global Search
            cv2.putText(frame_adjusted, "SEARCHING (GLOBAL)", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, roi_color, 2)
        else:
            # We have a lock. Create a 20% tracking window (10% up, 10% down).
            window_size = int(h * 0.10) 
            roi_top = max(0, last_known_y - window_size)
            roi_bottom = min(h, last_known_y + window_size)
            roi_color = (0, 255, 255) # Yellow means Active Tracking
            cv2.putText(frame_adjusted, "TRACKING (LOCAL)", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, roi_color, 2)

        # Ensure logical bounds just in case
        roi_top = max(0, min(roi_top, h - 1))
        roi_bottom = max(roi_top + 1, min(roi_bottom, h))

        # 6. Apply the dynamic mask
        mask = np.zeros_like(horizontal_edges)
        mask[roi_top:roi_bottom, :] = 255
        masked_edges = cv2.bitwise_and(horizontal_edges, mask)

        # 7. Find Lines
        lines = cv2.HoughLinesP(
            masked_edges, 
            rho=1, 
            theta=np.pi/180, 
            threshold=hough_thresh, 
            minLineLength=w // 6, 
            maxLineGap=200
        )

        display_img = frame_adjusted.copy()

        # Draw current ROI boundaries 
        cv2.line(display_img, (0, roi_top), (w, roi_top), roi_color, 2)
        cv2.line(display_img, (0, roi_bottom), (w, roi_bottom), roi_color, 2)

        # 8. Process Lines and Update Tracker
        line_found_this_frame = False

        if lines is not None:
            horizontal_lines = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                
                # Filter for roughly horizontal lines
                if abs(y1 - y2) < max(5, h // 50): 
                    length = abs(x2 - x1)
                    avg_y = (y1 + y2) // 2
                    horizontal_lines.append((avg_y, length, line[0]))
            
            if horizontal_lines:
                # Sort by length and take the longest one
                horizontal_lines.sort(key=lambda x: x[1], reverse=True)
                best_y = horizontal_lines[0][0]
                best_line = horizontal_lines[0][2]
                
                # Draw the best line (Red line)
                cv2.line(display_img, (best_line[0], best_line[1]), (best_line[2], best_line[3]), (0, 0, 255), 5)
                
                # UPDATE THE TRACKER
                last_known_y = best_y
                line_found_this_frame = True

        # 9. Fallback Logic: If we didn't find a line in our ROI, reset the tracker
        if not line_found_this_frame:
            last_known_y = None

        # 10. Display feeds
        cv2.imshow(window_name, display_img)
        cv2.imshow('Computer Vision (Dynamic Mask)', masked_edges)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()