import numpy as np
from math import *

def compute_dist(angle_degrees, orientation_degrees, pt):
    """
    Compute the distance between reference and target plane along line normal to reference plane at point pt

    Parameters:
    - angle_degrees (float): Tilt angle of the plane in degrees.
    - orientation_degrees (float): Orientation angle in degrees.
    - a, b, c (float): Coordinates of the point on the line normal to z = 0.

    Returns:
    - z-coordinate of intersection point
    """
    # Convert angles from degrees to radians
    angle_radians = np.radians(angle_degrees)
    orientation_radians = np.radians(orientation_degrees)

    a = pt[0]
    b = pt[1]
    c = pt[2]

    # Compute the normal vector of the tilted plane (coefficients of plane equation)
    A = np.sin(angle_radians) * np.cos(orientation_radians)
    B = np.sin(angle_radians) * np.sin(orientation_radians)
    C = np.cos(angle_radians)

    # The line is vertical (normal to z = 0) and passes through (a, b, c)
    # Line parametric equation: x = a, y = b, z = c + t

    # Substitute the line equations into the plane equation:
    # A(a) + B(b) + C(c + t) = 0
    # Solve for t:
    t = -(A * a + B * b + C * c) / C if C != 0 else None  # Avoid division by zero

    z_coord = c + t  # From the line equation

    return (z_coord)

# Example usage:
angle = 45  # Tilt angle in degrees
orientation = 0  # Orientation angle in degrees
a1 = [ 0 , 1 , 0 ]
a2 = [ -sqrt(3)/2 , -1/2 , 0 ]
a3 = [ sqrt(3)/2 , 1/2 , 0 ]
dist1 = compute_dist(angle, orientation, a1)
dist2 = compute_dist(angle, orientation, a2)
dist3 = compute_dist(angle, orientation, a3)
print("Distances", dist1, dist2, dist3)