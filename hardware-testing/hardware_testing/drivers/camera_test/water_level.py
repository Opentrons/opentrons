import cv2
import numpy as np

def nothing(x):
    # Trackbars require a callback function, but we don't need it to do anything
    pass

def main():
    # Initialize video capture. '0' is usually the built-in/default webcam.
    # Change to 1, 2, etc., for external USB cameras, or a URL for IP cameras.
    cap = cv2.VideoCapture(1)

    if not cap.isOpened():
        print("Error: Could not open camera feed.")
        return

    # Turn off auto-exposure (the value '0' or '0.25' usually turns it off depending on the camera)
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25) 
    
    # Manually set the exposure. This value is highly camera-dependent! 
    # Usually, it ranges from -10 to 0 (e.g., -4, -5). You may need to play with this number.
    cap.set(cv2.CAP_PROP_EXPOSURE, -8) 

    # Alternatively, try just boosting the camera's internal brightness setting
    # cap.set(cv2.CAP_PROP_BRIGHTNESS, 150) # Range is usually 0-255

    # Create a window for the UI
    window_name = 'Live Calibration'
    cv2.namedWindow(window_name)

    # --- Create Trackbars ---
    # cv2.createTrackbar(Name, Window, Initial Value, Max Value, Callback)
    cv2.createTrackbar('Canny Min', window_name, 40, 255, nothing)
    cv2.createTrackbar('Canny Max', window_name, 120, 255, nothing)
    cv2.createTrackbar('ROI Top (%)', window_name, 40, 100, nothing)
    cv2.createTrackbar('ROI Bottom (%)', window_name, 85, 100, nothing)
    cv2.createTrackbar('Hough Thresh', window_name, 30, 200, nothing)

    print("Press 'q' to quit.")

    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # Artificially boost brightness (beta) and contrast (alpha)
        # alpha > 1 increases contrast. beta > 0 increases brightness.
        alpha = 1 # Contrast control (1.0-3.0)
        beta = 20   # Brightness control (0-100)
        frame = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)
        h, w = frame.shape[:2]

        # 1. Read Current Trackbar Values
        canny_min = cv2.getTrackbarPos('Canny Min', window_name)
        canny_max = cv2.getTrackbarPos('Canny Max', window_name)
        roi_top_pct = cv2.getTrackbarPos('ROI Top (%)', window_name) / 100.0
        roi_bot_pct = cv2.getTrackbarPos('ROI Bottom (%)', window_name) / 100.0
        hough_thresh = max(1, cv2.getTrackbarPos('Hough Thresh', window_name)) # Prevent 0

        # 2. Preprocessing
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 3. Edge Detection
        edges = cv2.Canny(blurred, canny_min, canny_max)

        # 4. Morphological Operation (Dynamic scaling based on width)
        kernel_width = max(1, w // 20)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_width, 1))
        horizontal_edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)

        # 5. Apply ROI
        # Ensure logical bounds
        roi_top = max(0, min(int(h * roi_top_pct), h - 1))
        roi_bottom = max(roi_top + 1, min(int(h * roi_bot_pct), h))

        mask = np.zeros_like(horizontal_edges)
        mask[roi_top:roi_bottom, :] = 255
        masked_edges = cv2.bitwise_and(horizontal_edges, mask)

        # 6. Find Lines
        lines = cv2.HoughLinesP(
            masked_edges, 
            rho=1, 
            theta=np.pi/180, 
            threshold=hough_thresh, 
            minLineLength=w // 6, 
            maxLineGap=200
        )

        # Create a copy for drawing so we don't mess up the original frame
        display_img = frame.copy()

        # Draw ROI boundaries (Blue lines)
        cv2.line(display_img, (0, roi_top), (w, roi_top), (255, 0, 0), 2)
        cv2.line(display_img, (0, roi_bottom), (w, roi_bottom), (255, 0, 0), 2)

        # Process and Draw Detected Water Line
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
                best_line = horizontal_lines[0][2]
                
                # Draw the best line (Red line)
                cv2.line(display_img, (best_line[0], best_line[1]), (best_line[2], best_line[3]), (0, 0, 255), 5)

        # 7. Display the feeds
        cv2.imshow(window_name, display_img)
        
        # PRO TIP: Also show the binary mask. This lets you see exactly what the computer is analyzing!
        cv2.imshow('Computer Vision (Masked Edges)', masked_edges)

        # Break loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()